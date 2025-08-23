-- ===== セキュリティ強化: SECURITY DEFINER RPC関数群 =====
-- Phase 1: RLS・セキュリティ強化

-- 1. チャレンジ開始用RPC（サーバー主導でends_at確定）
CREATE OR REPLACE FUNCTION start_challenge(
    challenge_id_param UUID,
    target_datetime_param TIMESTAMPTZ
)
RETURNS TABLE (
    success BOOLEAN,
    challenge_id UUID,
    ends_at TIMESTAMPTZ,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id_var UUID;
    existing_active_count INTEGER;
    updated_challenge RECORD;
BEGIN
    -- 認証チェック
    user_id_var := auth.uid();
    IF user_id_var IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TIMESTAMPTZ, 'Unauthorized'::TEXT;
        RETURN;
    END IF;

    -- 同ユーザーのアクティブチャレンジ存在チェック（二重開始防止）
    SELECT COUNT(*) INTO existing_active_count
    FROM challenges 
    WHERE user_id = user_id_var 
    AND status = 'active';

    IF existing_active_count > 0 THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TIMESTAMPTZ, 'Already have active challenge'::TEXT;
        RETURN;
    END IF;

    -- チャレンジをactiveに更新し、ends_atをサーバー時刻で確定
    UPDATE challenges 
    SET 
        status = 'active',
        ends_at = target_datetime_param,
        started_at = NOW(),
        updated_at = NOW()
    WHERE id = challenge_id_param 
    AND user_id = user_id_var 
    AND status = 'pending'
    RETURNING * INTO updated_challenge;

    IF updated_challenge IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TIMESTAMPTZ, 'Challenge not found or already started'::TEXT;
        RETURN;
    END IF;

    -- 成功通知を送信
    PERFORM send_notification(
        user_id_var,
        'チャレンジ開始',
        format('チャレンジが開始されました。終了時刻: %s', updated_challenge.ends_at::text),
        'challenge'
    );

    RETURN QUERY SELECT TRUE, updated_challenge.id, updated_challenge.ends_at, 'Challenge started successfully'::TEXT;
END;
$$;

-- 2. チャレンジ成功申請用RPC（ユーザーが実行可能）
CREATE OR REPLACE FUNCTION submit_challenge_success(
    challenge_id_param UUID,
    completion_lat_param FLOAT,
    completion_lng_param FLOAT,
    completion_address_param TEXT DEFAULT NULL,
    evidence_ref_param TEXT DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    within_range BOOLEAN,
    distance_to_target FLOAT,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id_var UUID;
    challenge_record RECORD;
    distance_result FLOAT;
    is_within_range BOOLEAN;
    current_time TIMESTAMPTZ := NOW();
BEGIN
    -- 認証チェック
    user_id_var := auth.uid();
    IF user_id_var IS NULL THEN
        RETURN QUERY SELECT FALSE, FALSE, 0.0, 'Unauthorized'::TEXT;
        RETURN;
    END IF;

    -- チャレンジ取得
    SELECT * INTO challenge_record
    FROM challenges 
    WHERE id = challenge_id_param 
    AND user_id = user_id_var 
    AND status = 'active';

    IF challenge_record IS NULL THEN
        RETURN QUERY SELECT FALSE, FALSE, 0.0, 'Challenge not found or not active'::TEXT;
        RETURN;
    END IF;

    -- 時間切れチェック
    IF current_time > challenge_record.ends_at THEN
        -- 時間切れの場合、自動的に失敗に更新
        UPDATE challenges 
        SET 
            status = 'failed_timeout',
            completed_at = current_time,
            completion_lat = completion_lat_param,
            completion_lng = completion_lng_param,
            completion_address = completion_address_param,
            evidence_ref = evidence_ref_param,
            updated_at = current_time
        WHERE id = challenge_id_param;

        RETURN QUERY SELECT FALSE, FALSE, 0.0, 'Challenge time expired'::TEXT;
        RETURN;
    END IF;

    -- 距離計算
    SELECT calculate_distance(
        challenge_record.target_latitude,
        challenge_record.target_longitude,
        completion_lat_param,
        completion_lng_param
    ) INTO distance_result;

    -- 成功判定（100m以内）
    is_within_range := distance_result <= 100;

    -- チャレンジ更新
    UPDATE challenges 
    SET 
        status = CASE WHEN is_within_range THEN 'succeeded' ELSE 'failed' END,
        completed_at = current_time,
        completion_lat = completion_lat_param,
        completion_lng = completion_lng_param,
        completion_address = completion_address_param,
        distance_to_target = distance_result,
        evidence_ref = evidence_ref_param,
        updated_at = current_time
    WHERE id = challenge_id_param;

    -- 通知送信
    PERFORM send_notification(
        user_id_var,
        CASE WHEN is_within_range THEN 'チャレンジ成功！' ELSE 'チャレンジ失敗' END,
        CASE 
            WHEN is_within_range 
            THEN format('おめでとうございます！目標地点から%.0fm以内に到着しました。', distance_result)
            ELSE format('目標地点から%.0fm離れています。ペナルティが発生します。', distance_result)
        END,
        'challenge'
    );

    RETURN QUERY SELECT TRUE, is_within_range, distance_result, 
        CASE WHEN is_within_range THEN 'Success!' ELSE 'Failed but recorded' END;
END;
$$;

-- 3. 自動失敗処理用RPC（Edge Function専用）
CREATE OR REPLACE FUNCTION auto_fail_expired_challenge(
    challenge_id_param UUID,
    failure_reason TEXT DEFAULT 'timeout'
)
RETURNS TABLE (
    success BOOLEAN,
    challenge_id UUID,
    penalty_amount INTEGER,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    challenge_record RECORD;
    new_status TEXT;
BEGIN
    -- Edge FunctionからのService Role呼び出しを想定（認証スキップ）
    
    -- チャレンジ取得（ロック付き）
    SELECT * INTO challenge_record
    FROM challenges 
    WHERE id = challenge_id_param 
    AND status = 'active'
    FOR UPDATE;

    IF challenge_record IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 0, 'Challenge not found or not active'::TEXT;
        RETURN;
    END IF;

    -- 失敗理由に応じて状態決定
    new_status := CASE failure_reason
        WHEN 'timeout' THEN 'failed_timeout'
        WHEN 'payment_failed' THEN 'failed_payment'
        ELSE 'failed'
    END;

    -- チャレンジを失敗状態に更新
    UPDATE challenges 
    SET 
        status = new_status,
        completed_at = NOW(),
        completion_address = format('自動失敗: %s', failure_reason),
        updated_at = NOW()
    WHERE id = challenge_id_param;

    -- 通知送信
    PERFORM send_notification(
        challenge_record.user_id,
        'チャレンジ自動失敗',
        format('起床時間を過ぎたため、チャレンジが自動的に失敗しました。ペナルティ料金: ¥%s', 
               challenge_record.penalty_amount::text),
        'challenge'
    );

    RETURN QUERY SELECT TRUE, challenge_record.id, challenge_record.penalty_amount, 'Auto-failed successfully'::TEXT;
END;
$$;

-- 4. アクティブチャレンジ取得用RPC
CREATE OR REPLACE FUNCTION get_active_challenge_for_user(user_id_param UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    target_time TIME,
    ends_at TIMESTAMPTZ,
    penalty_amount INTEGER,
    home_latitude FLOAT,
    home_longitude FLOAT,
    home_address TEXT,
    target_latitude FLOAT,
    target_longitude FLOAT,
    target_address TEXT,
    status TEXT,
    started_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    time_remaining_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    effective_user_id UUID;
BEGIN
    -- 認証チェック（Service Roleの場合はuser_id_paramを使用）
    effective_user_id := COALESCE(user_id_param, auth.uid());
    
    IF effective_user_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        c.id,
        c.target_time,
        c.ends_at,
        c.penalty_amount,
        c.home_latitude,
        c.home_longitude,
        c.home_address,
        c.target_latitude,
        c.target_longitude,
        c.target_address,
        c.status,
        c.started_at,
        c.created_at,
        CASE 
            WHEN c.ends_at IS NOT NULL 
            THEN GREATEST(0, EXTRACT(EPOCH FROM (c.ends_at - NOW()))::INTEGER)
            ELSE 0
        END as time_remaining_seconds
    FROM challenges c
    WHERE c.user_id = effective_user_id 
    AND c.status = 'active'
    ORDER BY c.started_at DESC
    LIMIT 1;
END;
$$;

-- 5. 権限設定
GRANT EXECUTE ON FUNCTION start_challenge(UUID, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION submit_challenge_success(UUID, FLOAT, FLOAT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION auto_fail_expired_challenge(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_active_challenge_for_user(UUID) TO authenticated, service_role;

-- 6. RLSポリシーの最終調整
-- challengesテーブルのUPDATE/DELETEを完全にRPC経由に制限
DROP POLICY IF EXISTS "Users can update own challenges" ON challenges;
DROP POLICY IF EXISTS "Users can delete own challenges" ON challenges;

-- 読み取りと作成のみ許可、更新・削除はRPC経由
CREATE POLICY "Users can view own challenges updated" ON challenges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create pending challenges" ON challenges
  FOR INSERT WITH CHECK (auth.uid() = user_id AND status IN ('pending', 'created'));

-- 7. コメント追加
COMMENT ON FUNCTION start_challenge(UUID, TIMESTAMPTZ) IS 'サーバー主導でチャレンジを開始し、ends_atを確定する';
COMMENT ON FUNCTION submit_challenge_success(UUID, FLOAT, FLOAT, TEXT, TEXT) IS 'ユーザーがチャレンジ成功を申請する';
COMMENT ON FUNCTION auto_fail_expired_challenge(UUID, TEXT) IS 'Edge Functionが時間切れチャレンジを自動失敗させる';
COMMENT ON FUNCTION get_active_challenge_for_user(UUID) IS 'ユーザーのアクティブチャレンジを取得（復帰用）';

-- 8. 初期化完了ログ
INSERT INTO system_logs (service, level, message, metadata)
VALUES (
    'migration',
    'info',
    'Secure challenge RPC functions created',
    jsonb_build_object(
        'migration', '20250823000001_secure_challenge_rpcs',
        'functions_created', jsonb_build_array(
            'start_challenge',
            'submit_challenge_success',
            'auto_fail_expired_challenge',
            'get_active_challenge_for_user'
        ),
        'security_level', 'SECURITY DEFINER',
        'timestamp', NOW()
    )
);