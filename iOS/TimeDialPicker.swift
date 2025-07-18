import SwiftUI

struct TimeDialPicker: View {
    @Binding var selectedTime: Date
    @State private var isDraggingHour = false
    @State private var isDraggingMinute = false
    
    private let dialRadius: CGFloat = 120
    private let hourHandRadius: CGFloat = 90
    private let minuteHandRadius: CGFloat = 70
    private let centerSize: CGFloat = 12
    
    var body: some View {
        VStack(spacing: 30) {
            // Digital time display
            VStack(spacing: 8) {
                Text(timeString)
                    .font(.system(size: 48, weight: .ultraLight, design: .default))
                    .foregroundColor(.white)
                
                Text(ampmString)
                    .font(.system(size: 18, weight: .light))
                    .foregroundColor(.white.opacity(0.6))
            }
            
            // Dial picker
            ZStack {
                // Background circle with starry effect
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [
                                Color.black.opacity(0.3),
                                Color.black.opacity(0.6)
                            ],
                            center: .center,
                            startRadius: 0,
                            endRadius: dialRadius
                        )
                    )
                    .frame(width: dialRadius * 2, height: dialRadius * 2)
                    .overlay(
                        Circle()
                            .stroke(Color.white.opacity(0.2), lineWidth: 2)
                    )
                
                // Hour markers
                ForEach(0..<12, id: \.self) { hour in
                    let angle = Angle.degrees(Double(hour) * 30 - 90)
                    let position = positionFor(angle: angle, radius: 100)
                    let displayHour = hour == 0 ? 12 : hour
                    
                    Text("\(displayHour)")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.white.opacity(0.6))
                        .position(x: dialRadius + position.x, y: dialRadius + position.y)
                }
                
                // Minute markers (every 5 minutes)
                ForEach(0..<12, id: \.self) { index in
                    let minute = index * 5
                    let angle = Angle.degrees(Double(minute) * 6 - 90)
                    let position = positionFor(angle: angle, radius: 80)
                    
                    Text(String(format: "%02d", minute))
                        .font(.system(size: 10, weight: .light))
                        .foregroundColor(.white.opacity(0.4))
                        .position(x: dialRadius + position.x, y: dialRadius + position.y)
                }
                
                // Hour hand
                Path { path in
                    let angle = hourAngle
                    let endPosition = positionFor(angle: angle, radius: hourHandRadius)
                    path.move(to: CGPoint(x: dialRadius, y: dialRadius))
                    path.addLine(to: CGPoint(x: dialRadius + endPosition.x, y: dialRadius + endPosition.y))
                }
                .stroke(Color.orange, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                
                // Minute hand
                Path { path in
                    let angle = minuteAngle
                    let endPosition = positionFor(angle: angle, radius: minuteHandRadius)
                    path.move(to: CGPoint(x: dialRadius, y: dialRadius))
                    path.addLine(to: CGPoint(x: dialRadius + endPosition.x, y: dialRadius + endPosition.y))
                }
                .stroke(Color.white, style: StrokeStyle(lineWidth: 2, lineCap: .round))
                
                // Hour handle
                let hourHandPosition = positionFor(angle: hourAngle, radius: hourHandRadius)
                Circle()
                    .fill(Color.orange)
                    .frame(width: 24, height: 24)
                    .overlay(
                        Circle()
                            .stroke(Color.white, lineWidth: 2)
                    )
                    .position(x: dialRadius + hourHandPosition.x, y: dialRadius + hourHandPosition.y)
                    .scaleEffect(isDraggingHour ? 1.2 : 1.0)
                    .animation(.easeInOut(duration: 0.1), value: isDraggingHour)
                    .gesture(
                        DragGesture()
                            .onChanged { value in
                                isDraggingHour = true
                                updateHourFromDrag(location: value.location)
                            }
                            .onEnded { _ in
                                isDraggingHour = false
                            }
                    )
                
                // Minute handle
                let minuteHandPosition = positionFor(angle: minuteAngle, radius: minuteHandRadius)
                Circle()
                    .fill(Color.white)
                    .frame(width: 20, height: 20)
                    .overlay(
                        Circle()
                            .stroke(Color.black.opacity(0.8), lineWidth: 2)
                    )
                    .position(x: dialRadius + minuteHandPosition.x, y: dialRadius + minuteHandPosition.y)
                    .scaleEffect(isDraggingMinute ? 1.2 : 1.0)
                    .animation(.easeInOut(duration: 0.1), value: isDraggingMinute)
                    .gesture(
                        DragGesture()
                            .onChanged { value in
                                isDraggingMinute = true
                                updateMinuteFromDrag(location: value.location)
                            }
                            .onEnded { _ in
                                isDraggingMinute = false
                            }
                    )
                
                // Center dot
                Circle()
                    .fill(Color.white)
                    .frame(width: centerSize, height: centerSize)
                    .position(x: dialRadius, y: dialRadius)
            }
            .frame(width: dialRadius * 2, height: dialRadius * 2)
            
            // AM/PM toggle
            HStack(spacing: 4) {
                Button(action: { setAMPM(isAM: true) }) {
                    Text("AM")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(isAM ? .white : .white.opacity(0.6))
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(
                            isAM ? Color.orange : Color.clear
                        )
                        .clipShape(Capsule())
                }
                
                Button(action: { setAMPM(isAM: false) }) {
                    Text("PM")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(!isAM ? .white : .white.opacity(0.6))
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(
                            !isAM ? Color.orange : Color.clear
                        )
                        .clipShape(Capsule())
                }
            }
            .padding(4)
            .background(Color.black.opacity(0.5))
            .clipShape(Capsule())
        }
        .padding()
    }
    
    // MARK: - Computed Properties
    
    private var timeString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h : mm"
        return formatter.string(from: selectedTime)
    }
    
    private var ampmString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "a"
        return formatter.string(from: selectedTime)
    }
    
    private var isAM: Bool {
        Calendar.current.component(.hour, from: selectedTime) < 12
    }
    
    private var hourAngle: Angle {
        let hour = Calendar.current.component(.hour, from: selectedTime) % 12
        return Angle.degrees(Double(hour) * 30 - 90)
    }
    
    private var minuteAngle: Angle {
        let minute = Calendar.current.component(.minute, from: selectedTime)
        return Angle.degrees(Double(minute) * 6 - 90)
    }
    
    // MARK: - Helper Methods
    
    private func positionFor(angle: Angle, radius: CGFloat) -> CGPoint {
        let radians = angle.radians
        return CGPoint(
            x: radius * cos(radians),
            y: radius * sin(radians)
        )
    }
    
    private func updateHourFromDrag(location: CGPoint) {
        let center = CGPoint(x: dialRadius, y: dialRadius)
        let angle = atan2(location.y - center.y, location.x - center.x)
        let degrees = (angle * 180 / .pi + 90 + 360).truncatingRemainder(dividingBy: 360)
        let hour = Int(round(degrees / 30)) % 12
        
        var components = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: selectedTime)
        let currentHour = components.hour ?? 0
        let newHour = currentHour >= 12 ? (hour == 0 ? 12 : hour + 12) : (hour == 0 ? 0 : hour)
        components.hour = newHour
        
        if let newDate = Calendar.current.date(from: components) {
            selectedTime = newDate
        }
    }
    
    private func updateMinuteFromDrag(location: CGPoint) {
        let center = CGPoint(x: dialRadius, y: dialRadius)
        let angle = atan2(location.y - center.y, location.x - center.x)
        let degrees = (angle * 180 / .pi + 90 + 360).truncatingRemainder(dividingBy: 360)
        let minute = Int(round(degrees / 6)) % 60
        
        var components = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: selectedTime)
        components.minute = minute
        
        if let newDate = Calendar.current.date(from: components) {
            selectedTime = newDate
        }
    }
    
    private func setAMPM(isAM: Bool) {
        var components = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: selectedTime)
        let currentHour = components.hour ?? 0
        
        if isAM && currentHour >= 12 {
            components.hour = currentHour - 12
        } else if !isAM && currentHour < 12 {
            components.hour = currentHour + 12
        }
        
        if let newDate = Calendar.current.date(from: components) {
            selectedTime = newDate
        }
    }
}

// MARK: - Preview

struct TimeDialPicker_Previews: PreviewProvider {
    @State static private var selectedTime = Date()
    
    static var previews: some View {
        ZStack {
            // Dark starry background
            LinearGradient(
                colors: [
                    Color(red: 0.06, green: 0.09, blue: 0.16),
                    Color(red: 0.12, green: 0.16, blue: 0.24)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            TimeDialPicker(selectedTime: $selectedTime)
        }
    }
}