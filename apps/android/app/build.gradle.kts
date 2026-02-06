import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import java.util.Properties

plugins {
    id("com.android.application")
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
    compileSdk = 36

    defaultConfig {
        applicationId = "com.learnjapanese.app"
        minSdk = 26
        targetSdk = 36
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

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

dependencies {
    val composeBom = platform(libs.compose.bom)
    implementation(composeBom)
    androidTestImplementation(composeBom)

    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)

    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.google.material)

    implementation(libs.kotlinx.serialization.json)
    implementation(libs.kotlinx.coroutines.android)

    testImplementation(libs.junit4)

    debugImplementation(libs.androidx.compose.ui.tooling)
}
