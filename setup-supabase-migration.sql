-- Migration: Add missing columns to challenges table

-- 1. Add missing columns for challenge completion
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS target_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS home_lat FLOAT,
ADD COLUMN IF NOT EXISTS home_lng FLOAT,
ADD COLUMN IF NOT EXISTS target_lat FLOAT,
ADD COLUMN IF NOT EXISTS target_lng FLOAT,
ADD COLUMN IF NOT EXISTS completion_lat FLOAT,
ADD COLUMN IF NOT EXISTS completion_lng FLOAT,
ADD COLUMN IF NOT EXISTS completion_address TEXT,
ADD COLUMN IF NOT EXISTS distance_to_target FLOAT,
ADD COLUMN IF NOT EXISTS wake_up_location_address TEXT,
ADD COLUMN IF NOT EXISTS wake_up_location_lat FLOAT,
ADD COLUMN IF NOT EXISTS wake_up_location_lng FLOAT,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;

-- 2. Update existing wake_time to target_time if data exists
UPDATE challenges 
SET target_time = CURRENT_DATE + wake_time 
WHERE target_time IS NULL AND wake_time IS NOT NULL;

-- 3. Extract coordinates from geography columns if they exist
UPDATE challenges 
SET 
  home_lat = ST_Y(home_location::geometry),
  home_lng = ST_X(home_location::geometry),
  target_lat = ST_Y(target_location::geometry),
  target_lng = ST_X(target_location::geometry)
WHERE home_lat IS NULL AND home_location IS NOT NULL;

-- 4. Add updated_at trigger for challenges
CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 5. Create notifications table for push notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT DEFAULT 'general' CHECK (type IN ('general', 'challenge', 'reminder')),
  is_read BOOLEAN DEFAULT FALSE,
  push_sent BOOLEAN DEFAULT FALSE,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Create user_settings table for app settings
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  push_notifications_enabled BOOLEAN DEFAULT TRUE,
  reminder_enabled BOOLEAN DEFAULT TRUE,
  reminder_minutes_before INTEGER DEFAULT 10,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  timezone TEXT DEFAULT 'Asia/Tokyo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Create push_subscriptions table for web push
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Enable RLS for new tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 9. Add RLS policies for new tables
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can create own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own push subscriptions" ON push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own push subscriptions" ON push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own push subscriptions" ON push_subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own push subscriptions" ON push_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- 10. Add updated_at triggers for new tables
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON push_subscriptions
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 11. Create function to automatically create user settings on profile creation
CREATE OR REPLACE FUNCTION handle_new_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create trigger for automatic user settings creation
CREATE TRIGGER on_profile_created_settings
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user_settings();

-- 13. Create function for challenge completion with distance calculation
CREATE OR REPLACE FUNCTION complete_challenge(
    challenge_id UUID,
    completion_lat_param FLOAT,
    completion_lng_param FLOAT,
    completion_address_param TEXT DEFAULT NULL
) RETURNS TABLE (
    success BOOLEAN,
    distance_to_target FLOAT,
    within_range BOOLEAN
) AS $$
DECLARE
    target_lat_val FLOAT;
    target_lng_val FLOAT;
    calculated_distance FLOAT;
    is_within_range BOOLEAN;
    completion_status TEXT;
BEGIN
    -- Get target coordinates
    SELECT target_lat, target_lng INTO target_lat_val, target_lng_val
    FROM challenges 
    WHERE id = challenge_id;
    
    -- Calculate distance
    calculated_distance := calculate_distance(
        completion_lat_param, 
        completion_lng_param, 
        target_lat_val, 
        target_lng_val
    );
    
    -- Check if within 100m range
    is_within_range := calculated_distance <= 100;
    completion_status := CASE WHEN is_within_range THEN 'completed' ELSE 'failed' END;
    
    -- Update challenge
    UPDATE challenges 
    SET 
        status = completion_status,
        completed_at = TIMEZONE('utc'::text, NOW()),
        completion_lat = completion_lat_param,
        completion_lng = completion_lng_param,
        completion_address = completion_address_param,
        distance_to_target = calculated_distance
    WHERE id = challenge_id;
    
    -- Return results
    RETURN QUERY SELECT is_within_range, calculated_distance, is_within_range;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;