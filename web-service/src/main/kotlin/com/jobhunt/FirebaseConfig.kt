package com.jobhunt

import com.google.auth.oauth2.GoogleCredentials
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.auth.FirebaseAuth
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.io.ByteArrayInputStream

@Configuration
class FirebaseConfig {

    @Bean
    fun firebaseAuth(): FirebaseAuth {
        val serviceAccountJson = System.getenv("FIREBASE_SERVICE_ACCOUNT")
            ?: error("FIREBASE_SERVICE_ACCOUNT environment variable is not set")

        val credentials = GoogleCredentials.fromStream(
            ByteArrayInputStream(serviceAccountJson.toByteArray())
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
