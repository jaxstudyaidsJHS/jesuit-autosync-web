import SwiftUI
import Foundation
import FirebaseCore

@main
struct JesuitScoreboardsDevApp: App {
    @StateObject private var model = DevelopmentSession()

    init() {
        if let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
           let options = FirebaseOptions(contentsOfFile: path),
           options.projectID == "jesuit-scoreboards-2-0-staging",
           options.databaseURL?.trimmingCharacters(in: CharacterSet(charactersIn: "/")) == "https://jesuit-scoreboards-2-0-staging-default-rtdb.firebaseio.com",
           options.bundleID == Bundle.main.bundleIdentifier {
            FirebaseApp.configure(options: options)
        }
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(model)
                .preferredColorScheme(.dark)
        }
    }
}
