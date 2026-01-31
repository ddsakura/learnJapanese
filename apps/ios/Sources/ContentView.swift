import SwiftUI

struct ContentView: View {
    @StateObject private var state = AppState()
    @State private var practice: PracticeKind = .verb

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                Picker("練習類型", selection: $practice) {
                    Text("動詞").tag(PracticeKind.verb)
                    Text("形容詞").tag(PracticeKind.adjective)
                }
                .pickerStyle(.segmented)
                .onChange(of: practice) { _, newValue in
                    state.nextQuestion(practice: newValue)
                }

                if let question = state.currentQuestion {
                    QuestionCardView(question: question)
                } else {
                    Text("目前題庫沒有可用題目")
                        .foregroundStyle(.secondary)
                }

                Button("下一題") {
                    state.nextQuestion(practice: practice)
                }
                .buttonStyle(.borderedProminent)

                if let error = state.errorMessage {
                    Text(error)
                        .font(.footnote)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                        .padding(.top, 8)
                }

                Spacer()
            }
            .padding()
            .navigationTitle("LearnJapanese")
        }
    }
}

#Preview {
    ContentView()
}
