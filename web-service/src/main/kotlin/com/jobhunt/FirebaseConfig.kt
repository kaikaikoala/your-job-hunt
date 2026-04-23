package com.jobhunt

import com.google.auth.oauth2.GoogleCredentials
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.auth.FirebaseAuth
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.io.ByteArrayInputStream
import java.io.File

@Configuration
class FirebaseConfig {

    @Bean
    fun firebaseAuth(
        @Value("\${firebase.service-account:}") serviceAccountJson: String,
        @Value("\${firebase.service-account-file:}") serviceAccountFile: String,
    ): FirebaseAuth {
        val json = when {
            serviceAccountJson.isNotBlank() -> serviceAccountJson
            serviceAccountFile.isNotBlank() -> File(serviceAccountFile).readText()
            else -> error("Neither firebase.service-account nor firebase.service-account-file is configured")
        }

        val credentials = GoogleCredentials.fromStream(
            ByteArrayInputStream(json.toByteArray())
        )

        val options = FirebaseOptions.builder()
            .setCredentials(credentials)
            .build()

        if (FirebaseApp.getApps().isEmpty()) {
            FirebaseApp.initializeApp(options)
        }

        return FirebaseAuth.getInstance()
    }
}
