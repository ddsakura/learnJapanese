import SwiftUI

struct QuestionCardView: View {
    let question: QuestionViewModel

    var body: some View {
        VStack(spacing: 12) {
            Text(question.card.dict)
                .font(.system(size: 36, weight: .semibold))
            Text("→")
                .font(.system(size: 20, weight: .regular))
                .foregroundStyle(.secondary)
            Text(question.promptLabel)
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(.green)
        }
        .frame(maxWidth: .infinity)
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color(.systemBackground))
                .shadow(color: Color.black.opacity(0.05), radius: 10, x: 0, y: 4)
        )
    }
}

#Preview {
    QuestionCardView(
        question: QuestionViewModel(
            card: CardFixture(
                dict: "行く",
                nai: "行かない",
                ta: "行った",
                nakatta: "行かなかった",
                te: "行って",
                potential: "行ける",
                group: "godan",
                zh: nil
            ),
            type: .ta
        )
    )
    .padding()
}
