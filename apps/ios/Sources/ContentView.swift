import SwiftUI

struct ContentView: View {
    @StateObject private var state = AppState()
    @State private var practice: PracticeKind = .verb

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    Picker("練習類型", selection: $practice) {
                        Text("動詞").tag(PracticeKind.verb)
                        Text("形容詞").tag(PracticeKind.adjective)
                    }
                    .pickerStyle(.segmented)
                    .onChange(of: practice) { _, newValue in
                        state.nextQuestion(practice: newValue)
                    }

                    Picker("作答方式", selection: $state.answerMode) {
                        Text("文字輸入").tag(AnswerMode.input)
                        Text("四選一").tag(AnswerMode.choice)
                    }
                    .pickerStyle(.segmented)
                    .onChange(of: state.answerMode) { _, newValue in
                        if newValue == .choice {
                            state.generateChoices()
                        } else {
                            state.choiceOptions = []
                        }
                    }

                    if let question = state.currentQuestion {
                        QuestionCardView(question: question)

                        if state.answerMode == .input {
                            VStack(spacing: 8) {
                                TextField("輸入答案", text: $state.answerText)
                                    .textFieldStyle(.roundedBorder)
                                    .disabled(state.result != nil)
                                HStack {
                                    Button("批改") {
                                        state.submitAnswer(state.answerText)
                                    }
                                    .buttonStyle(.borderedProminent)
                                    .disabled(state.result != nil)
                                    Button("略過") {
                                        state.skip()
                                    }
                                    .buttonStyle(.bordered)
                                    .disabled(state.result != nil)
                                }
                            }
                        } else {
                            VStack(spacing: 8) {
                                ForEach(state.choiceOptions, id: \.self) { option in
                                    Button {
                                        state.submitAnswer(option)
                                    } label: {
                                        Text(option)
                                            .frame(maxWidth: .infinity, alignment: .center)
                                    }
                                    .buttonStyle(.bordered)
                                    .disabled(state.result != nil)
                                }
                                HStack {
                                    Button("重新產生選項") {
                                        state.generateChoices()
                                    }
                                    .buttonStyle(.bordered)
                                    .disabled(state.result != nil)
                                    Button("略過") {
                                        state.skip()
                                    }
                                    .buttonStyle(.bordered)
                                    .disabled(state.result != nil)
                                }
                            }
                            .frame(maxWidth: .infinity)
                        }

                        if let result = state.result {
                            VStack(spacing: 8) {
                                Text(result.correct ? "✅ 正確" : "❌ 錯誤 / 略過")
                                    .font(.headline)
                                    .foregroundStyle(result.correct ? .green : .red)
                                VStack(spacing: 6) {
                                    HStack {
                                        Text("題型")
                                        Spacer()
                                        Text(result.type.label)
                                    }
                                    HStack {
                                        Text("我的答案")
                                        Spacer()
                                        Text(result.userAnswer.isEmpty ? "（空白）" : result.userAnswer)
                                    }
                                    HStack {
                                        Text("正確答案")
                                        Spacer()
                                        Text(result.correctAnswer)
                                    }
                                }
                                .font(.subheadline)
                            }
                            .padding(.top, 8)
                        }

                        if case .loading = state.aiStatus {
                            Text("翻譯與例句產生中…")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                                .padding(.top, 6)
                    } else if case .error(let message) = state.aiStatus {
                        Text(message)
                            .font(.footnote)
                            .foregroundStyle(.red)
                            .multilineTextAlignment(.center)
                            .padding(.top, 6)
                    } else {
                            if let translation = state.translationText {
                                HStack {
                                    Text("中文翻譯")
                                    Spacer()
                                    Text(translation)
                                }
                                .font(.subheadline)
                                .padding(.top, 6)
                            }
                            if let example = state.example {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("例句")
                                        .font(.subheadline)
                                        .fontWeight(.semibold)
                                    Text(example.jp)
                                    Text(example.reading)
                                        .foregroundStyle(.secondary)
                                        .font(.footnote)
                                    Text(example.zh)
                                        .foregroundStyle(.secondary)
                                    Text(example.grammar)
                                        .foregroundStyle(.secondary)
                                        .font(.footnote)
                                }
                                .padding(.top, 6)
                            }
                        }
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
                }
                .padding()
            }
            .navigationTitle("LearnJapanese")
        }
    }
}

#Preview {
    ContentView()
}
