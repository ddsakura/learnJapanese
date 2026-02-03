import SwiftUI

struct ContentView: View {
    @StateObject private var state = AppState()
    @AppStorage("learnJapanese.practiceKind") private var practiceRaw: String = PracticeKind.verb.rawValue
    @State private var showBankSheet = false
    @State private var showSettingsSheet = false

    var body: some View {
        let practice = PracticeKind(rawValue: practiceRaw) ?? .verb
        let practiceBinding = Binding<PracticeKind>(
            get: { PracticeKind(rawValue: practiceRaw) ?? .verb },
            set: { practiceRaw = $0.rawValue }
        )
        let wrongCount = state.wrongToday.items.filter { $0.practice == practice.rawValue }.count
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    Button {
                        showSettingsSheet = true
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "gearshape.fill")
                                .foregroundStyle(.secondary)
                            Text("學習設定")
                                .fontWeight(.semibold)
                            Text("·")
                                .foregroundStyle(.secondary)
                            Text(settingsSummary(practice: practice))
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundStyle(.secondary)
                        }
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                        .background(Color.secondary.opacity(0.12))
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
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
                            VStack(spacing: 10) {
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
                            .padding(12)
                            .background(
                                RoundedRectangle(cornerRadius: 16, style: .continuous)
                                    .stroke(Color.secondary.opacity(0.2), lineWidth: 1)
                            )
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
                            VStack(spacing: 0) {
                                HStack {
                                    Text("題型")
                                    Spacer()
                                    Text(result.type.label)
                                }
                                .padding(.vertical, 10)

                                Divider()

                                HStack {
                                    Text("我的答案")
                                    Spacer()
                                    Text(result.userAnswer.isEmpty ? "（空白）" : result.userAnswer)
                                }
                                .padding(.vertical, 10)

                                Divider()

                                HStack {
                                    Text("正確答案")
                                    Spacer()
                                    Text(result.correctAnswer)
                                }
                                .padding(.vertical, 10)
                            }
                            .font(.subheadline)
                            .padding(.horizontal, 12)
                            .background(
                                RoundedRectangle(cornerRadius: 16, style: .continuous)
                                    .stroke(Color.secondary.opacity(0.2), lineWidth: 1)
                            )
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
                            Text("\(wrongCount)")
                                .font(.headline)
                        }
                    }
                    .padding(.top, 8)
                    .padding(12)
                    .background(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .stroke(Color.secondary.opacity(0.2), lineWidth: 1)
                    )

                    if state.mode == .reviewWrong {
                        HStack {
                            Label("錯題複習中", systemImage: "arrow.triangle.2.circlepath")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                            Spacer()
                            Button("回到正常題庫") {
                                state.exitReview()
                            }
                            .buttonStyle(.bordered)
                        }
                    } else {
                        Button("複習今日答錯") {
                            state.startReview()
                        }
                        .buttonStyle(.bordered)
                        .disabled(wrongCount == 0)
                    }

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
                        if state.translationText != nil || state.example != nil {
                            VStack(alignment: .leading, spacing: 10) {
                                if let translation = state.translationText {
                                    HStack {
                                        Text("中文翻譯")
                                            .font(.subheadline)
                                            .fontWeight(.semibold)
                                        Spacer()
                                        Text(translation)
                                    }
                                }

                                if let example = state.example {
                                    VStack(alignment: .leading, spacing: 6) {
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
                                }
                            }
                            .padding(12)
                            .background(
                                RoundedRectangle(cornerRadius: 16, style: .continuous)
                                    .stroke(Color.secondary.opacity(0.2), lineWidth: 1)
                            )
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
                    Text(state.mode == .reviewWrong ? "目前沒有可複習錯題" : "目前題庫沒有可用題目")
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
            .sheet(isPresented: $showSettingsSheet) {
                SettingsView(
                    practice: practiceBinding,
                    answerMode: $state.answerMode,
                    questionType: $state.selectedQuestionType,
                    verbScope: $state.selectedVerbScope,
                    adjectiveScope: $state.selectedAdjectiveScope,
                    onApply: {
                        state.nextQuestion(practice: practice)
                        if state.answerMode == .choice {
                            state.generateChoices()
                        } else {
                            state.choiceOptions = []
                        }
                    }
                )
            }
        }
    }

    private func settingsSummary(practice: PracticeKind) -> String {
        let practiceText = practice == .verb ? "動詞" : "形容詞"
        let modeText = state.answerMode == .choice ? "四選一" : "文字輸入"
        let typeText = state.selectedQuestionType.label
        let scopeText: String
        if practice == .verb {
            scopeText = state.selectedVerbScope.label
        } else {
            scopeText = state.selectedAdjectiveScope.label
        }
        return "\(practiceText)・\(modeText)・\(typeText)・\(scopeText)"
    }
}

#Preview {
    ContentView()
}

private struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @Binding var practice: PracticeKind
    @Binding var answerMode: AnswerMode
    @Binding var questionType: QuestionType
    @Binding var verbScope: VerbScope
    @Binding var adjectiveScope: AdjectiveScope
    let onApply: () -> Void

    var body: some View {
        NavigationStack {
            Form {
                Section("學習對象") {
                    Picker("學習對象", selection: $practice) {
                        Text("動詞").tag(PracticeKind.verb)
                        Text("形容詞").tag(PracticeKind.adjective)
                    }
                    .pickerStyle(.segmented)
                }

                Section("作答方式") {
                    Picker("作答方式", selection: $answerMode) {
                        Text("文字輸入").tag(AnswerMode.input)
                        Text("四選一").tag(AnswerMode.choice)
                    }
                    .pickerStyle(.segmented)
                }

                Section("題型") {
                    ForEach(QuestionType.allCases, id: \.self) { type in
                        HStack {
                            Text(type.label)
                            Spacer()
                            if questionType == type {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(.tint)
                            }
                        }
                        .contentShape(Rectangle())
                        .onTapGesture {
                            questionType = type
                        }
                    }
                }

                if practice == .verb {
                    Section("動詞種類") {
                        ForEach(VerbScope.allCases, id: \.self) { scope in
                            HStack {
                                Text(scope.label)
                                Spacer()
                                if verbScope == scope {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundStyle(.tint)
                                }
                            }
                            .contentShape(Rectangle())
                            .onTapGesture {
                                verbScope = scope
                            }
                        }
                    }
                } else {
                    Section("形容詞種類") {
                        ForEach(AdjectiveScope.allCases, id: \.self) { scope in
                            HStack {
                                Text(scope.label)
                                Spacer()
                                if adjectiveScope == scope {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundStyle(.tint)
                                }
                            }
                            .contentShape(Rectangle())
                            .onTapGesture {
                                adjectiveScope = scope
                            }
                        }
                    }
                }
            }
            .navigationTitle("學習設定")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("取消") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("套用") {
                        onApply()
                        dismiss()
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}
