import SwiftUI

@main
struct JesuitScoreboardsDevApp: App {
    @StateObject private var model = DevelopmentSession()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(model)
                .preferredColorScheme(.dark)
        }
    }
}
