package com.learnjapanese.app.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.learnjapanese.app.data.AdjectiveScope
import com.learnjapanese.app.data.AnswerMode
import com.learnjapanese.app.data.PracticeKind
import com.learnjapanese.app.data.QuestionType
import com.learnjapanese.app.data.VerbScope

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ContentScreen(viewModel: AppViewModel) {
    var showBankSheet by remember { mutableStateOf(false) }
    var showSettingsSheet by remember { mutableStateOf(false) }

    val scrollState = rememberScrollState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("LearnJapanese") },
                actions = {
                    TextButton(onClick = { showBankSheet = true }) {
                        Text("題庫管理")
                    }
                },
            )
        },
    ) { padding ->
        Column(
            modifier =
                Modifier
                    .padding(padding)
                    .verticalScroll(scrollState)
                    .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            SettingsSummaryRow(
                summary = settingsSummary(viewModel),
                onClick = { showSettingsSheet = true },
            )

            if (viewModel.currentQuestion != null) {
                QuestionCard(viewModel = viewModel)
                AnswerSection(viewModel = viewModel)
                ResultSection(viewModel = viewModel)
                StatsSection(viewModel = viewModel)
                ReviewSection(viewModel = viewModel)
                AiSection(viewModel = viewModel)
            } else {
                Text(
                    text =
                        if (viewModel.mode == com.learnjapanese.app.data.PracticeMode.REVIEW_WRONG) {
                            "目前沒有可複習錯題"
                        } else {
                            "目前題庫沒有可用題目"
                        },
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            Button(
                onClick = { viewModel.nextQuestion(viewModel.currentPractice) },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("下一題")
            }

            viewModel.errorMessage?.let {
                Text(
                    text = it,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall,
                )
            }
            viewModel.speechMessage?.let {
                Text(
                    text = it,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall,
                )
            }
        }
    }

    if (showBankSheet) {
        ModalBottomSheet(
            onDismissRequest = { showBankSheet = false },
            sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = false),
        ) {
            BankSheet(viewModel = viewModel, onClose = { showBankSheet = false })
        }
    }

    if (showSettingsSheet) {
        ModalBottomSheet(
            onDismissRequest = { showSettingsSheet = false },
            sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = false),
        ) {
            SettingsSheet(viewModel = viewModel, onClose = { showSettingsSheet = false })
        }
    }
}

@Composable
private fun SettingsSummaryRow(
    summary: String,
    onClick: () -> Unit,
) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surfaceVariant,
        tonalElevation = 1.dp,
    ) {
        Row(
            modifier =
                Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("學習設定", fontWeight = FontWeight.SemiBold)
            Text(" · ", color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(
                summary,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Spacer(modifier = Modifier.weight(1f))
            Text("›", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun QuestionCard(viewModel: AppViewModel) {
    val question = viewModel.currentQuestion ?: return
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        ElevatedCard(
            modifier = Modifier.weight(1f),
            shape = RoundedCornerShape(16.dp),
        ) {
            Column(
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(
                    text = question.card.dict,
                    fontSize = 36.sp,
                    fontWeight = FontWeight.SemiBold,
                )
                Text("→", fontSize = 20.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(
                    question.promptLabel,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color(0xFF2E7D32),
                )
            }
        }

        Surface(
            modifier = Modifier.size(width = 60.dp, height = 46.dp),
            shape = RoundedCornerShape(18.dp),
            color = MaterialTheme.colorScheme.surfaceVariant,
            onClick = { viewModel.speakQuestion() },
        ) {
            Box(contentAlignment = Alignment.Center) {
                Text("🔊", fontSize = 24.sp, color = MaterialTheme.colorScheme.primary)
            }
        }
    }
}

@Composable
private fun AnswerSection(viewModel: AppViewModel) {
    val question = viewModel.currentQuestion ?: return
    val rowHeight = 44.dp
    val strokeColor = MaterialTheme.colorScheme.outline
    val softFill = MaterialTheme.colorScheme.surfaceVariant

    if (viewModel.answerMode == AnswerMode.INPUT) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            border = BorderStroke(1.dp, strokeColor),
            color = MaterialTheme.colorScheme.surface,
        ) {
            Column(
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                OutlinedTextField(
                    value = viewModel.answerText,
                    onValueChange = { viewModel.answerText = it },
                    label = { Text("輸入答案") },
                    enabled = viewModel.result == null,
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = { viewModel.submitAnswer(viewModel.answerText) },
                        modifier = Modifier.weight(1f).height(rowHeight),
                        enabled = viewModel.result == null,
                    ) {
                        Text("批改")
                    }
                    OutlinedButton(
                        onClick = { viewModel.skip() },
                        modifier = Modifier.weight(1f).height(rowHeight),
                        enabled = viewModel.result == null,
                    ) {
                        Text("略過")
                    }
                }
            }
        }
    } else {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            viewModel.choiceOptions.forEach { option ->
                val isSelected = viewModel.result?.userAnswer == option
                val isCorrect = viewModel.result?.correctAnswer == option
                ChoiceButton(
                    text = option,
                    strokeColor = strokeColor,
                    softFill = softFill,
                    isSelected = isSelected,
                    isCorrect = isCorrect,
                    showResult = viewModel.result != null,
                    enabled = viewModel.result == null,
                    onClick = { viewModel.submitAnswer(option) },
                )
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(
                    onClick = { viewModel.generateChoices() },
                    modifier = Modifier.weight(1f).height(rowHeight),
                    enabled = viewModel.result == null,
                ) {
                    Text("重新產生選項")
                }
                OutlinedButton(
                    onClick = { viewModel.skip() },
                    modifier = Modifier.weight(1f).height(rowHeight),
                    enabled = viewModel.result == null,
                ) {
                    Text("略過")
                }
            }
        }
    }
}

@Composable
private fun ChoiceButton(
    text: String,
    strokeColor: Color,
    softFill: Color,
    isSelected: Boolean,
    isCorrect: Boolean,
    showResult: Boolean,
    enabled: Boolean,
    onClick: () -> Unit,
) {
    val fill =
        when {
            showResult && isCorrect -> Color(0xFF2E7D32).copy(alpha = 0.18f)
            showResult && isSelected -> Color(0xFFC62828).copy(alpha = 0.18f)
            isSelected -> MaterialTheme.colorScheme.primary.copy(alpha = 0.18f)
            else -> softFill
        }
    val stroke =
        when {
            showResult && isCorrect -> Color(0xFF2E7D32).copy(alpha = 0.6f)
            showResult && isSelected -> Color(0xFFC62828).copy(alpha = 0.6f)
            else -> strokeColor
        }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = fill,
        border = BorderStroke(1.dp, stroke),
        onClick = onClick,
        enabled = enabled,
    ) {
        Box(
            modifier =
                Modifier
                    .fillMaxWidth()
                    .padding(vertical = 10.dp, horizontal = 8.dp),
            contentAlignment = Alignment.Center,
        ) {
            Text(text)
        }
    }
}

@Composable
private fun ResultSection(viewModel: AppViewModel) {
    val result = viewModel.result ?: return
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        val (color, label) =
            if (result.correct) {
                Color(0xFF2E7D32) to "正確！"
            } else {
                MaterialTheme.colorScheme.error to "不正確"
            }

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            color = color.copy(alpha = 0.1f),
            border = BorderStroke(1.dp, color.copy(alpha = 0.5f)),
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text(label, color = color, fontWeight = FontWeight.Bold)
                if (!result.correct) {
                    Text("正確答案：${result.correctAnswer}", color = color)
                }
            }
        }
    }
}

@Composable
private fun StatsSection(viewModel: AppViewModel) {
    val wrongCount = viewModel.wrongToday.items.count { it.practice == viewModel.currentPractice.raw }
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
    ) {
        Row(
            modifier =
                Modifier
                    .fillMaxWidth()
                    .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            StatItem(label = "今日答題數", value = viewModel.stats.todayCount.toString())
            VerticalDivider()
            StatItem(label = "連續答對", value = viewModel.stats.streak.toString())
            VerticalDivider()
            StatItem(label = "今日答錯", value = wrongCount.toString())
        }
    }
}

@Composable
private fun VerticalDivider() {
    Box(
        modifier =
            Modifier
                .height(28.dp)
                .width(1.dp)
                .background(MaterialTheme.colorScheme.outline)
                .padding(horizontal = 8.dp),
    )
}

@Composable
private fun RowScope.StatItem(
    label: String,
    value: String,
) {
    Column(
        modifier = Modifier.weight(1f),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, style = MaterialTheme.typography.titleMedium)
    }
}

@Composable
private fun ReviewSection(viewModel: AppViewModel) {
    val wrongCount = viewModel.wrongToday.items.count { it.practice == viewModel.currentPractice.raw }
    if (viewModel.mode == com.learnjapanese.app.data.PracticeMode.REVIEW_WRONG) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                "錯題複習中",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(modifier = Modifier.weight(1f))
            OutlinedButton(onClick = { viewModel.exitReview() }) {
                Text("回到正常題庫")
            }
        }
    } else {
        OutlinedButton(
            onClick = { viewModel.startReview() },
            enabled = wrongCount > 0,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("複習今日答錯")
        }
    }
}

@Composable
private fun AiSection(viewModel: AppViewModel) {
    when (val status = viewModel.aiStatus) {
        is AIStatus.Loading -> {
            Row(verticalAlignment = Alignment.CenterVertically) {
                CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    "翻譯與例句產生中…",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }

        is AIStatus.Error -> {
            Text(status.message, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.error)
        }

        AIStatus.Idle -> {
            val translation = viewModel.translationText
            val example = viewModel.example
            viewModel.aiSourceNote?.let { note ->
                Text(
                    note,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            if (translation != null || example != null) {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
                ) {
                    Column(
                        modifier =
                            Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        translation?.let {
                            Row {
                                Text("中文翻譯", fontWeight = FontWeight.SemiBold)
                                Spacer(modifier = Modifier.weight(1f))
                                Text(it)
                            }
                        }
                        if (translation != null && example != null) {
                            HorizontalDivider()
                        }
                        example?.let { data ->
                            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text("例句", fontWeight = FontWeight.SemiBold)
                                OutlinedButton(onClick = { viewModel.speakExample() }) {
                                    Text("朗讀例句")
                                }
                                Text(data.jp)
                                Text(
                                    data.reading,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                                Text(data.zh, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text(
                                    data.grammar,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }
                    }
                }
            }
            if (viewModel.result != null) {
                OutlinedButton(
                    onClick = { viewModel.regenerateAI() },
                    enabled = viewModel.aiStatus != AIStatus.Loading,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("重新產生翻譯/例句")
                }
            }
        }
    }
}

@Composable
private fun BankSheet(
    viewModel: AppViewModel,
    onClose: () -> Unit,
) {
    Column(
        modifier =
            Modifier
                .fillMaxWidth()
                .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(
            text = "目前題庫共有 ${if (viewModel.currentPractice == PracticeKind.VERB) viewModel.verbBank.size else viewModel.adjectiveBank.size} 個單字。",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        OutlinedTextField(
            value = viewModel.bankText,
            onValueChange = { viewModel.bankText = it },
            modifier =
                Modifier
                    .fillMaxWidth()
                    .heightIn(min = 220.dp),
            label = { Text("題庫 JSON") },
            textStyle = MaterialTheme.typography.bodySmall,
        )

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(onClick = { viewModel.exportBank(viewModel.currentPractice) }) {
                Text("匯出題庫")
            }
            Button(onClick = { viewModel.importBank(viewModel.currentPractice) }, enabled = !viewModel.isImporting) {
                Text("匯入題庫")
            }
            OutlinedButton(onClick = { viewModel.resetBank(viewModel.currentPractice) }) {
                Text("重置題庫")
            }
        }

        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                text =
                    if (viewModel.currentPractice == PracticeKind.VERB) {
                        "快速輸入動詞（空白/逗號分隔）"
                    } else {
                        "快速輸入形容詞（空白/逗號分隔）"
                    },
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            OutlinedTextField(
                value = viewModel.quickInput,
                onValueChange = { viewModel.quickInput = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("例如：行く 見る 勉強する") },
            )
            Button(onClick = { viewModel.quickImport(viewModel.currentPractice) }, enabled = !viewModel.isImporting) {
                Text("快速匯入")
            }
        }

        if (viewModel.bankMessage.isNotEmpty()) {
            Text(
                viewModel.bankMessage,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }

        Spacer(modifier = Modifier.height(6.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
            TextButton(onClick = onClose) { Text("完成") }
        }
    }
}

@Composable
private fun SettingsSheet(
    viewModel: AppViewModel,
    onClose: () -> Unit,
) {
    var pendingPractice by remember { mutableStateOf(viewModel.currentPractice) }
    var pendingAnswerMode by remember { mutableStateOf(viewModel.answerMode) }
    var pendingQuestionType by remember { mutableStateOf(viewModel.selectedQuestionType) }
    var pendingVerbScope by remember { mutableStateOf(viewModel.selectedVerbScope) }
    var pendingAdjectiveScope by remember { mutableStateOf(viewModel.selectedAdjectiveScope) }
    var pendingOllamaEnabled by remember { mutableStateOf(viewModel.ollamaEnabled) }
    var pendingOllamaBaseUrl by remember { mutableStateOf(viewModel.ollamaBaseUrl.ifBlank { "http://10.0.2.2:11434" }) }
    var pendingOllamaModel by remember { mutableStateOf(viewModel.ollamaModel.ifBlank { "translategemma:12b" }) }

    Column(
        modifier =
            Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text("學習設定", style = MaterialTheme.typography.titleMedium)

        SettingsSection(title = "學習對象") {
            SegmentedRow(
                options = listOf(PracticeKind.VERB to "動詞", PracticeKind.ADJECTIVE to "形容詞"),
                selected = pendingPractice,
                onSelect = { pendingPractice = it },
            )
        }

        SettingsSection(title = "作答方式") {
            SegmentedRow(
                options = listOf(AnswerMode.INPUT to "文字輸入", AnswerMode.CHOICE to "四選一"),
                selected = pendingAnswerMode,
                onSelect = { pendingAnswerMode = it },
            )
        }

        SettingsSection(title = "題型") {
            val availableTypes =
                if (pendingPractice == PracticeKind.VERB) {
                    QuestionType.entries
                } else {
                    QuestionType.entries.filter { it != QuestionType.POTENTIAL }
                }
            availableTypes.forEachIndexed { index, type ->
                SelectableRow(
                    label = type.label,
                    selected = pendingQuestionType == type,
                    onClick = { pendingQuestionType = type },
                    showDivider = index < availableTypes.lastIndex,
                )
            }
        }

        if (pendingPractice == PracticeKind.VERB) {
            SettingsSection(title = "動詞種類") {
                VerbScope.entries.forEachIndexed { index, scope ->
                    SelectableRow(
                        label = scope.label,
                        selected = pendingVerbScope == scope,
                        onClick = { pendingVerbScope = scope },
                        showDivider = index < VerbScope.entries.lastIndex,
                    )
                }
            }
        } else {
            SettingsSection(title = "形容詞種類") {
                AdjectiveScope.entries.forEachIndexed { index, scope ->
                    SelectableRow(
                        label = scope.label,
                        selected = pendingAdjectiveScope == scope,
                        onClick = { pendingAdjectiveScope = scope },
                        showDivider = index < AdjectiveScope.entries.lastIndex,
                    )
                }
            }
        }

        SettingsSection(title = "AI（Ollama）") {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("啟用 Ollama")
                Spacer(modifier = Modifier.weight(1f))
                Switch(
                    checked = pendingOllamaEnabled,
                    onCheckedChange = { pendingOllamaEnabled = it },
                )
            }
            OutlinedTextField(
                value = pendingOllamaBaseUrl,
                onValueChange = { pendingOllamaBaseUrl = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Base URL") },
                placeholder = { Text("http://10.0.2.2:11434") },
                enabled = pendingOllamaEnabled,
            )
            OutlinedTextField(
                value = pendingOllamaModel,
                onValueChange = { pendingOllamaModel = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Model") },
                placeholder = { Text("translategemma:12b") },
                enabled = pendingOllamaEnabled,
            )
        }

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
            TextButton(onClick = onClose) { Text("取消") }
            Spacer(modifier = Modifier.width(8.dp))
            Button(
                onClick = {
                    viewModel.setPracticeKind(pendingPractice)
                    viewModel.setAnswerMode(pendingAnswerMode)
                    viewModel.setQuestionType(pendingQuestionType)
                    viewModel.setVerbScope(pendingVerbScope)
                    viewModel.setAdjectiveScope(pendingAdjectiveScope)
                    viewModel.setOllamaConfig(
                        enabled = pendingOllamaEnabled,
                        baseUrl = pendingOllamaBaseUrl,
                        model = pendingOllamaModel,
                    )
                    viewModel.nextQuestion(pendingPractice)
                    if (pendingAnswerMode == AnswerMode.CHOICE) {
                        viewModel.generateChoices()
                    }
                    onClose()
                },
            ) {
                Text("套用")
            }
        }
    }
}

@Composable
private fun SettingsSection(
    title: String,
    content: @Composable () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(title, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Surface(
            shape = RoundedCornerShape(14.dp),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
            color = MaterialTheme.colorScheme.surface,
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(10.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                content()
            }
        }
    }
}

@Composable
private fun <T> SegmentedRow(
    options: List<Pair<T, String>>,
    selected: T,
    onSelect: (T) -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        options.forEach { (value, label) ->
            val isSelected = value == selected
            Surface(
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(999.dp),
                color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                border =
                    BorderStroke(
                        1.dp,
                        if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant,
                    ),
                onClick = { onSelect(value) },
            ) {
                Box(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        label,
                        color = if (isSelected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
                        fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Medium,
                    )
                }
            }
        }
    }
}

@Composable
private fun SelectableRow(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    showDivider: Boolean = false,
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier =
                Modifier
                    .fillMaxWidth()
                    .clickable { onClick() }
                    .padding(vertical = 10.dp, horizontal = 2.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                label,
                color = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
                fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
            )
            Spacer(modifier = Modifier.weight(1f))
            if (selected) {
                Text("✓", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold)
            }
        }
        if (showDivider) {
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
        }
    }
}

private fun settingsSummary(viewModel: AppViewModel): String {
    val practiceText = if (viewModel.currentPractice == PracticeKind.VERB) "動詞" else "形容詞"
    val modeText = if (viewModel.answerMode == AnswerMode.CHOICE) "四選一" else "文字輸入"
    val typeText = viewModel.selectedQuestionType.label
    val scopeText =
        if (viewModel.currentPractice == PracticeKind.VERB) {
            viewModel.selectedVerbScope.label
        } else {
            viewModel.selectedAdjectiveScope.label
        }
    return "$practiceText・$modeText・$typeText・$scopeText"
}
