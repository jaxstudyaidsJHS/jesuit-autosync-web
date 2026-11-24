import SwiftUI
import AVFoundation
import JesuitScoreboardsCore

private let darkBackground = Color(red: 0.045, green: 0.08, blue: 0.16)
private let cardBackground = Color(red: 0.075, green: 0.14, blue: 0.26)
private let signalBlue = Color(red: 0.31, green: 0.69, blue: 0.98)

struct RootView: View {
    var body: some View {
        TabView {
            DashboardView()
                .tabItem { Label("Game", systemImage: "sportscourt.fill") }
            RemoteView()
                .tabItem { Label("Remote", systemImage: "slider.horizontal.3") }
            CameraSetupView()
                .tabItem { Label("Camera", systemImage: "camera.viewfinder") }
            FirebaseStagingView()
                .tabItem { Label("Staging", systemImage: "cloud") }
            SystemView()
                .tabItem { Label("System", systemImage: "waveform.path.ecg") }
        }
        .tint(signalBlue)
    }
}

private struct StatusBanner: View {
    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: "shield.lefthalf.filled")
                .foregroundStyle(.yellow)
            VStack(alignment: .leading, spacing: 2) {
                Text("OFF-AIR DEMONSTRATION")
                    .font(.caption.bold())
                Text("No Mac or OBS commands are enabled. Staging is read-only.")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            Spacer()
        }
        .padding(14)
        .background(cardBackground, in: RoundedRectangle(cornerRadius: 14))
        .accessibilityElement(children: .combine)
    }
}

private struct Panel<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(title.uppercased())
                .font(.caption.bold())
                .tracking(1.4)
                .foregroundStyle(signalBlue)
            content
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(cardBackground, in: RoundedRectangle(cornerRadius: 18))
    }
}

private struct DashboardView: View {
    @EnvironmentObject private var session: DevelopmentSession

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    StatusBanner()
                    Panel(title: "Sport") {
                        Picker("Select sport", selection: Binding(
                            get: { session.selectedSport },
                            set: { session.selectSport($0) }
                        )) {
                            ForEach(Sport.allCases, id: \.self) { sport in
                                Text(sport.rawValue.capitalized).tag(sport)
                            }
                        }
                        .pickerStyle(.menu)
                    }
                    Panel(title: "Game preview") {
                        HStack {
                            VStack {
                                Text("HOME").font(.caption).foregroundStyle(.secondary)
                                Text("\(session.snapshot.homeScore)").font(.system(size: 54, weight: .black, design: .rounded))
                            }
                            Spacer()
                            VStack(spacing: 5) {
                                Text(session.selectedSport == .baseball ? "INNING" : "CLOCK")
                                    .font(.caption2).foregroundStyle(.secondary)
                                Text(session.selectedSport == .baseball ? "1" : session.snapshot.clock.stoppedDisplay)
                                    .font(.system(size: 32, weight: .bold, design: .monospaced))
                                    .monospacedDigit()
                                Text("PERIOD \(session.snapshot.period)")
                                    .font(.caption2).foregroundStyle(.secondary)
                            }
                            Spacer()
                            VStack {
                                Text("AWAY").font(.caption).foregroundStyle(.secondary)
                                Text("\(session.snapshot.awayScore)").font(.system(size: 54, weight: .black, design: .rounded))
                            }
                        }
                    }
                    Panel(title: "Live workflow") {
                        Label("Pairing not configured", systemImage: "iphone.slash")
                        Label("Mac authority not connected", systemImage: "desktopcomputer")
                        Label("OBS verification not connected", systemImage: "video.slash")
                    }
                    Text("These values are sample data. Existing Jesuit Scoreboards v1.9.9 remains your broadcast app.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .padding()
            }
            .background(darkBackground)
            .navigationTitle("Jesuit Scoreboards")
        }
    }
}

private struct RemoteView: View {
    @EnvironmentObject private var session: DevelopmentSession

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    StatusBanner()
                    Panel(title: "Protected scoring") {
                        Toggle("Confirm every score change", isOn: $session.protectionEnabled)
                            .tint(signalBlue)
                        Text("Local preview preference only. No scoring commands are available in this development shell.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        HStack {
                            Button("Home +1") {}
                            Spacer()
                            Button("Away +1") {}
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(true)
                    }
                    Panel(title: "Edit game clock") {
                        if session.selectedSport == .baseball {
                            Text("Baseball uses inning state instead of a game countdown.")
                                .foregroundStyle(.secondary)
                        } else {
                            HStack {
                                TextField("Minutes", text: $session.draftMinutes)
                                    .keyboardType(.numberPad)
                                    .textFieldStyle(.roundedBorder)
                                    .accessibilityLabel("Clock minutes")
                                Text(":").font(.title.bold())
                                TextField("Seconds", text: $session.draftSeconds)
                                    .keyboardType(.numberPad)
                                    .textFieldStyle(.roundedBorder)
                                    .accessibilityLabel("Clock seconds")
                            }
                            HStack {
                                ForEach([-10, -1, 1, 10], id: \.self) { offset in
                                    Button(offset > 0 ? "+\(offset)s" : "\(offset)s") {
                                        session.shiftDraft(by: offset)
                                    }
                                    .buttonStyle(.bordered)
                                    .frame(maxWidth: .infinity)
                                }
                            }
                            Text("Proposed time: \(session.proposedClock)")
                                .font(.system(.headline, design: .monospaced))
                            Button("Set Mac Clock") {}
                                .buttonStyle(.borderedProminent)
                                .disabled(true)
                            Text("Changes remain local until secure pairing, operator approval and exact Mac acknowledgments are implemented.")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .padding()
            }
            .background(darkBackground)
            .navigationTitle("Remote")
        }
    }
}

private struct CameraSetupView: View {
    @State private var authorization = AVCaptureDevice.authorizationStatus(for: .video)

    private var permissionMessage: String {
        switch authorization {
        case .authorized: return "Camera permission granted. Capture and OCR are not implemented in this shell."
        case .notDetermined: return "Camera permission has not been requested."
        case .denied: return "Camera access denied. You can change this in iPhone Settings."
        case .restricted: return "Camera access is restricted on this device."
        @unknown default: return "Camera permission unavailable."
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    StatusBanner()
                    Panel(title: "Native camera foundation") {
                        Image(systemName: "camera.metering.center.weighted")
                            .font(.system(size: 56))
                            .foregroundStyle(signalBlue)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                        Text(permissionMessage)
                            .foregroundStyle(.secondary)
                        if authorization == .notDetermined {
                            Button("Request Camera Permission") {
                                AVCaptureDevice.requestAccess(for: .video) { _ in
                                    Task { @MainActor in
                                        authorization = AVCaptureDevice.authorizationStatus(for: .video)
                                    }
                                }
                            }
                            .buttonStyle(.borderedProminent)
                        }
                    }
                    Panel(title: "Planned camera pipeline") {
                        Label("AVFoundation video input", systemImage: "video")
                        Label("Apple Vision scoreboard recognition", systemImage: "viewfinder")
                        Label("Venue calibration and multi-frame validation", systemImage: "scope")
                        Label("Safe manual takeover", systemImage: "hand.raised")
                        Text("No images are captured, saved or uploaded by this development shell.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding()
            }
            .background(darkBackground)
            .navigationTitle("Camera")
        }
    }
}

private struct SystemView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    StatusBanner()
                    Panel(title: "Build") {
                        LabeledContent("Application", value: "2.0 development shell")
                        LabeledContent("Protocol", value: "v2")
                        LabeledContent("Mode", value: "Demo / read-only")
                    }
                    Panel(title: "Connectivity") {
                        LabeledContent("iPhone ↔ Firebase", value: "See Staging tab")
                        LabeledContent("Firebase ↔ Mac", value: "Not configured")
                        LabeledContent("Mac ↔ OBS", value: "Not configured")
                    }
                    Panel(title: "Safety policy") {
                        Label("No live writes", systemImage: "lock.shield")
                        Label("No cloud credentials embedded", systemImage: "key.slash")
                        Label("No automatic live deployment", systemImage: "checkmark.shield")
                    }
                }
                .padding()
            }
            .background(darkBackground)
            .navigationTitle("System")
        }
    }
}
