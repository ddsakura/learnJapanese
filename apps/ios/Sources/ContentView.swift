import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack(spacing: 16) {
            Text("LearnJapanese")
                .font(.title)
                .fontWeight(.semibold)
            Text("SwiftUI app skeleton created by XcodeGen")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
