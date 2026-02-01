import SwiftUI

struct ContentView: View {
    @StateObject private var state = AppState()
    @State private var practice: PracticeKind = .verb
    @State private var showBankSheet = false

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

                Picker("題型", selection: $state.selectedQuestionType) {
                    ForEach(QuestionType.allCases, id: \.self) { type in
                        Text(type.label).tag(type)
                    }
                }
                .pickerStyle(.segmented)
                .onChange(of: state.selectedQuestionType) { _, _ in
                    state.nextQuestion(practice: practice)
                }

                if practice == .verb {
                    Picker("範圍", selection: $state.selectedVerbScope) {
                        ForEach(VerbScope.allCases, id: \.self) { scope in
                            Text(scope.label).tag(scope)
                        }
                    }
                    .pickerStyle(.segmented)
                    .onChange(of: state.selectedVerbScope) { _, _ in
                        state.nextQuestion(practice: practice)
                    }
                } else {
                    Picker("範圍", selection: $state.selectedAdjectiveScope) {
                        ForEach(AdjectiveScope.allCases, id: \.self) { scope in
                            Text(scope.label).tag(scope)
                        }
                    }
                    .pickerStyle(.segmented)
                    .onChange(of: state.selectedAdjectiveScope) { _, _ in
                        state.nextQuestion(practice: practice)
                    }
                }

                    if let question = state.currentQuestion {
                        HStack {
                            QuestionCardView(question: question)
                            Button {
                                state.speakQuestion()
                            } label: {
                                Image(systemName: "speaker.wave.2.fill")
                            }
                            .buttonStyle(.bordered)
                        }

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

                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("今日答題數")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text("\(state.stats.todayCount)")
                                .font(.headline)
                        }
                        Spacer()
                        VStack(alignment: .leading, spacing: 2) {
                            Text("連續答對")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text("\(state.stats.streak)")
                                .font(.headline)
                        }
                        Spacer()
                        VStack(alignment: .leading, spacing: 2) {
                            Text("今日答錯")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text("\(state.wrongToday.count)")
                                .font(.headline)
                        }
                    }
                    .padding(.top, 8)

                        if case .loading = state.aiStatus {
                            HStack(spacing: 8) {
                                ProgressView()
                                    .scaleEffect(0.9)
                                Text("翻譯與例句產生中…")
                                    .font(.footnote)
                                    .foregroundStyle(.secondary)
                            }
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
                                Button {
                                    state.speakExample()
                                } label: {
                                    Label("朗讀例句", systemImage: "speaker.wave.2")
                                }
                                .buttonStyle(.bordered)
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
                        if state.result != nil {
                            Button("重新產生翻譯/例句") {
                                state.regenerateAI()
                            }
                            .buttonStyle(.bordered)
                            .padding(.top, 6)
                            .disabled(state.aiStatus == .loading)
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
            .toolbar {
                Button("題庫管理") {
                    showBankSheet = true
                }
            }
            .sheet(isPresented: $showBankSheet) {
                NavigationStack {
                    VStack(spacing: 12) {
                        Text("目前題庫共有 \(practice == .verb ? state.verbBank.count : state.adjectiveBank.count) 個單字。")
                            .font(.footnote)
                            .foregroundStyle(.secondary)

                        TextEditor(text: $state.bankText)
                            .font(.system(.body, design: .monospaced))
                            .border(Color.secondary.opacity(0.2))
                            .frame(minHeight: 220)

                        HStack {
                            Button("匯出題庫") {
                                state.exportBank(practice: practice)
                            }
                            .buttonStyle(.bordered)

                            Button("匯入題庫") {
                                state.importBank(practice: practice)
                            }
                            .buttonStyle(.borderedProminent)
                            .disabled(state.isImporting)

                            Button("重置題庫") {
                                state.resetBank(practice: practice)
                            }
                            .buttonStyle(.bordered)
                        }

                        VStack(alignment: .leading, spacing: 8) {
                            Text(practice == .verb ? "快速輸入動詞（空白/逗號分隔）" : "快速輸入形容詞（空白/逗號分隔）")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                            TextField("例如：行く 見る 勉強する", text: $state.quickInput)
                                .textFieldStyle(.roundedBorder)
                            Button("快速匯入") {
                                state.quickImport(practice: practice)
                            }
                            .buttonStyle(.borderedProminent)
                            .disabled(state.isImporting)
                        }

                        if !state.bankMessage.isEmpty {
                            Text(state.bankMessage)
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }

                        Spacer()
                    }
                    .padding()
                    .navigationTitle("題庫管理")
                    .toolbar {
                        Button("完成") {
                            showBankSheet = false
                        }
                    }
                }
            }
        }
    }
}

#Preview {
    ContentView()
}
