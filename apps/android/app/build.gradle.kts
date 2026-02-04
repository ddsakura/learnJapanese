import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.serialization")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    val localProperties =
        Properties().apply {
            val localFile = rootProject.file("local.properties")
            if (localFile.exists()) {
                localFile.inputStream().use { load(it) }
            }
        }
    val ollamaBaseUrl =
        (localProperties.getProperty("ollama.baseUrl") ?: "http://10.0.2.2:11434")
            .replace("\"", "\\\"")
    val ollamaModel =
        (localProperties.getProperty("ollama.model") ?: "translategemma:12b")
            .replace("\"", "\\\"")
    val ollamaEnabled = (localProperties.getProperty("ollama.enabled") ?: "true").toBoolean()

    namespace = "com.learnjapanese.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.learnjapanese.app"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    buildTypes {
        debug {
            buildConfigField("String", "OLLAMA_BASE_URL", "\"$ollamaBaseUrl\"")
            buildConfigField("String", "OLLAMA_MODEL", "\"$ollamaModel\"")
            buildConfigField("boolean", "OLLAMA_ENABLED", ollamaEnabled.toString())
        }
        release {
            buildConfigField("String", "OLLAMA_BASE_URL", "\"$ollamaBaseUrl\"")
            buildConfigField("String", "OLLAMA_MODEL", "\"$ollamaModel\"")
            buildConfigField("boolean", "OLLAMA_ENABLED", "false")
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.10.00")
    implementation(composeBom)
    androidTestImplementation(composeBom)

    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.5")
    implementation("androidx.activity:activity-compose:1.9.2")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.5")

    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("com.google.android.material:material:1.12.0")

    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")

    debugImplementation("androidx.compose.ui:ui-tooling")
}
