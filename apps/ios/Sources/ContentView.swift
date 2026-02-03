import SwiftUI

struct ContentView: View {
    @StateObject private var state = AppState()
    @AppStorage("learnJapanese.practiceKind") private var practiceRaw: String = PracticeKind.verb.rawValue
    @State private var showBankSheet = false
    @State private var showSettingsSheet = false
    private let cardStroke = Color(uiColor: .separator)
    private let softFill = Color(uiColor: .secondarySystemBackground)
    private let cardCorner: CGFloat = 16
    private let rowHeight: CGFloat = 44
    private let cardPadding: CGFloat = 12
    private let primaryTint = Color.accentColor
    private let secondaryTint = Color.accentColor

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
                        .frame(minHeight: rowHeight)
                        .background(softFill)
                        .clipShape(RoundedRectangle(cornerRadius: cardCorner, style: .continuous))
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
                                    .tint(primaryTint)
                                    .frame(minHeight: rowHeight)
                                    .disabled(state.result != nil)
                                    Button("略過") {
                                        state.skip()
                                    }
                                    .buttonStyle(.bordered)
                                    .tint(secondaryTint)
                                    .frame(minHeight: rowHeight)
                                    .disabled(state.result != nil)
                                }
                            }
                            .padding(cardPadding)
                            .background(
                                RoundedRectangle(cornerRadius: cardCorner, style: .continuous)
                                    .stroke(cardStroke, lineWidth: 1)
                            )
                        } else {
                            VStack(spacing: 8) {
                                ForEach(state.choiceOptions, id: \.self) { option in
                                    let isSelected = state.result?.userAnswer == option
                                    let isCorrect = state.result?.correctAnswer == option
                                    Button {
                                        state.submitAnswer(option)
                                    } label: {
                                        Text(option)
                                            .frame(maxWidth: .infinity, alignment: .center)
                                    }
                                    .buttonStyle(ChoiceButtonStyle(
                                        corner: 14,
                                        stroke: cardStroke,
                                        fill: softFill,
                                        pressedFill: Color.accentColor.opacity(0.15),
                                        selectedFill: Color.accentColor.opacity(0.18),
                                        correctFill: Color.green.opacity(0.18),
                                        wrongFill: Color.red.opacity(0.18),
                                        minHeight: rowHeight,
                                        isSelected: isSelected,
                                        isCorrect: isCorrect,
                                        showResult: state.result != nil
                                    ))
                                    .disabled(state.result != nil)
                                }
                                HStack {
                                    Button("重新產生選項") {
                                        state.generateChoices()
                                    }
                                    .buttonStyle(.bordered)
                                    .tint(secondaryTint)
                                    .frame(minHeight: rowHeight)
                                    .disabled(state.result != nil)
                                    Button("略過") {
                                        state.skip()
                                    }
                                    .buttonStyle(.bordered)
                                    .tint(secondaryTint)
                                    .frame(minHeight: rowHeight)
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
                            .padding(.horizontal, cardPadding)
                            .background(
                                RoundedRectangle(cornerRadius: cardCorner, style: .continuous)
                                    .stroke(cardStroke, lineWidth: 1)
                            )
                        }
                        .padding(.top, 8)
                    }

                    HStack {
                        VStack(spacing: 2) {
                            Text("今日答題數")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text("\(state.stats.todayCount)")
                                .font(.headline)
                        }
                        .frame(maxWidth: .infinity)
                        Divider()
                            .frame(height: 28)
                        Spacer()
                        VStack(spacing: 2) {
                            Text("連續答對")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text("\(state.stats.streak)")
                                .font(.headline)
                        }
                        .frame(maxWidth: .infinity)
                        Divider()
                            .frame(height: 28)
                        Spacer()
                        VStack(spacing: 2) {
                            Text("今日答錯")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text("\(wrongCount)")
                                .font(.headline)
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .padding(.top, 8)
                    .padding(cardPadding)
                    .background(
                        RoundedRectangle(cornerRadius: cardCorner, style: .continuous)
                            .stroke(cardStroke, lineWidth: 1)
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
                            .tint(secondaryTint)
                            .frame(minHeight: rowHeight)
                        }
                    } else {
                        Button("複習今日答錯") {
                            state.startReview()
                        }
                        .buttonStyle(.bordered)
                        .tint(secondaryTint)
                        .frame(minHeight: rowHeight)
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

                                if state.translationText != nil && state.example != nil {
                                    Divider()
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
                                        .tint(secondaryTint)
                                        .frame(minHeight: rowHeight)
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
                            .padding(cardPadding)
                            .background(
                                RoundedRectangle(cornerRadius: cardCorner, style: .continuous)
                                    .stroke(cardStroke, lineWidth: 1)
                            )
                            .padding(.top, 6)
                        }
                        if state.result != nil {
                            Button("重新產生翻譯/例句") {
                                state.regenerateAI()
                            }
                            .buttonStyle(.bordered)
                            .tint(secondaryTint)
                            .frame(minHeight: rowHeight)
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
                    .tint(primaryTint)

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
                            .tint(secondaryTint)

                            Button("匯入題庫") {
                                state.importBank(practice: practice)
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(primaryTint)
                            .disabled(state.isImporting)

                            Button("重置題庫") {
                                state.resetBank(practice: practice)
                            }
                            .buttonStyle(.bordered)
                            .tint(secondaryTint)
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
                            .tint(primaryTint)
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

private struct ChoiceButtonStyle: ButtonStyle {
    let corner: CGFloat
    let stroke: Color
    let fill: Color
    let pressedFill: Color
    let selectedFill: Color
    let correctFill: Color
    let wrongFill: Color
    let minHeight: CGFloat
    let isSelected: Bool
    let isCorrect: Bool
    let showResult: Bool

    func makeBody(configuration: Configuration) -> some View {
        let resolvedFill: Color = {
            if showResult {
                if isCorrect { return correctFill }
                if isSelected { return wrongFill }
            }
            if isSelected { return selectedFill }
            return configuration.isPressed ? pressedFill : fill
        }()

        let resolvedStroke: Color = {
            if showResult {
                if isCorrect { return Color.green.opacity(0.6) }
                if isSelected { return Color.red.opacity(0.6) }
            }
            return stroke
        }()

        configuration.label
            .frame(maxWidth: .infinity, minHeight: minHeight)
            .padding(.vertical, 6)
            .padding(.horizontal, 8)
            .background(
                RoundedRectangle(cornerRadius: corner, style: .continuous)
                    .fill(resolvedFill)
            )
            .overlay(
                RoundedRectangle(cornerRadius: corner, style: .continuous)
                    .stroke(resolvedStroke, lineWidth: configuration.isPressed ? 1.4 : 1)
            )
            .scaleEffect(configuration.isPressed ? 0.99 : 1.0)
            .animation(.easeOut(duration: 0.08), value: configuration.isPressed)
    }
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
