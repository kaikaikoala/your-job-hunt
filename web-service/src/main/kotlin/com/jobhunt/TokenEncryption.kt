package com.jobhunt

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.security.SecureRandom
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

@Component
class TokenEncryption(
    @Value("\${app.token.encryption-key}") private val encryptionKey: String,
) {
    private val key: SecretKey by lazy {
        val keyBytes = Base64.getUrlDecoder().decode(encryptionKey)
        SecretKeySpec(keyBytes, "AES")
    }

    fun encrypt(plaintext: String): String {
        val nonce = ByteArray(12).also { SecureRandom().nextBytes(it) }
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, key, GCMParameterSpec(128, nonce))
        val ciphertextWithTag = cipher.doFinal(plaintext.toByteArray(Charsets.UTF_8))
        return Base64.getUrlEncoder().withoutPadding().encodeToString(nonce + ciphertextWithTag)
    }

    fun decrypt(ciphertext: String): String {
        val combined = Base64.getUrlDecoder().decode(ciphertext)
        val nonce = combined.copyOfRange(0, 12)
        val ciphertextWithTag = combined.copyOfRange(12, combined.size)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, key, GCMParameterSpec(128, nonce))
        return String(cipher.doFinal(ciphertextWithTag), Charsets.UTF_8)
    }
}
