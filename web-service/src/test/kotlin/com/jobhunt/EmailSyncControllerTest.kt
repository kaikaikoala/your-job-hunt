package com.jobhunt

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseToken
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.any
import org.mockito.ArgumentMatchers.anyString
import org.mockito.ArgumentMatchers.eq
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.context.annotation.Import
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.ResponseEntity
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.web.client.RestTemplate
import java.util.Optional
import java.util.UUID

@WebMvcTest(EmailSyncController::class)
@Import(SecurityConfig::class, FirebaseTokenFilter::class)
class EmailSyncControllerTest {

    @Autowired
    lateinit var mvc: MockMvc

    @MockBean lateinit var firebaseAuth: FirebaseAuth
    @MockBean lateinit var userService: UserService
    @MockBean lateinit var syncRepo: EmailSyncRepository
    @MockBean lateinit var emailSettingsRepo: EmailSettingsRepository
    @MockBean lateinit var tokenEncryption: TokenEncryption
    @MockBean lateinit var restTemplate: RestTemplate

    private val testFirebaseUid = "test-uid"
    private val testUserId = UUID.fromString("00000000-0000-0000-0000-000000000099")
    private val testSyncId = UUID.fromString("00000000-0000-0000-0000-000000000042")
    private val validToken = "valid-token"

    @BeforeEach
    fun setupAuth() {
        val mockToken = mock(FirebaseToken::class.java)
        `when`(mockToken.uid).thenReturn(testFirebaseUid)
        `when`(firebaseAuth.verifyIdToken(validToken)).thenReturn(mockToken)
        val testUser = User(userId = testUserId, firebaseUid = testFirebaseUid)
        `when`(userService.findOrCreate(testFirebaseUid)).thenReturn(testUser)
    }

    // ── POST /email-syncs ────────────────────────────────────────────────────

    @Test
    fun `POST email-syncs without auth returns 401`() {
        mvc.post("/email-syncs").andExpect {
            status { isUnauthorized() }
        }
    }

    @Test
    fun `POST email-syncs with no email settings returns 404`() {
        `when`(emailSettingsRepo.findById(testUserId)).thenReturn(Optional.empty())

        mvc.post("/email-syncs") {
            header("Authorization", "Bearer $validToken")
        }.andExpect {
            status { isNotFound() }
        }
    }

    @Test
    fun `POST email-syncs happy path returns 202 with sync_id`() {
        val fakeSettings = EmailSettings(
            userId = testUserId,
            email = "test@example.com",
            accessToken = "enc-access",
            refreshToken = "enc-refresh",
        )
        `when`(emailSettingsRepo.findById(testUserId)).thenReturn(Optional.of(fakeSettings))
        `when`(tokenEncryption.decrypt("enc-access")).thenReturn("raw-access")
        `when`(tokenEncryption.decrypt("enc-refresh")).thenReturn("raw-refresh")

        val savedSync = EmailSync(syncId = testSyncId, userId = testUserId)
        `when`(syncRepo.save(any(EmailSync::class.java))).thenReturn(savedSync)

        `when`(
            restTemplate.postForEntity(
                any(String::class.java),
                any(),
                eq(String::class.java),
            )
        ).thenReturn(ResponseEntity.ok("ok"))

        mvc.post("/email-syncs") {
            header("Authorization", "Bearer $validToken")
        }.andExpect {
            status { isAccepted() }
            jsonPath("$.syncId") { value(testSyncId.toString()) }
            jsonPath("$.status") { value("running") }
        }
    }

    @Test
    fun `POST email-syncs with running sync returns 409`() {
        val fakeSettings = EmailSettings(
            userId = testUserId,
            email = "test@example.com",
            accessToken = "enc-access",
            refreshToken = "enc-refresh",
        )
        `when`(emailSettingsRepo.findById(testUserId)).thenReturn(Optional.of(fakeSettings))
        `when`(tokenEncryption.decrypt(anyString())).thenReturn("raw-token")
        `when`(syncRepo.save(any(EmailSync::class.java)))
            .thenThrow(DataIntegrityViolationException("duplicate"))

        mvc.post("/email-syncs") {
            header("Authorization", "Bearer $validToken")
        }.andExpect {
            status { isConflict() }
        }
    }

    // ── GET /email-syncs ─────────────────────────────────────────────────────

    @Test
    fun `GET email-syncs without auth returns 401`() {
        mvc.get("/email-syncs").andExpect {
            status { isUnauthorized() }
        }
    }

    @Test
    fun `GET email-syncs happy path returns list`() {
        val sync = EmailSync(syncId = testSyncId, userId = testUserId, status = "completed")
        `when`(syncRepo.findAllByUserIdOrderByStartedAtDesc(testUserId)).thenReturn(listOf(sync))

        mvc.get("/email-syncs") {
            header("Authorization", "Bearer $validToken")
        }.andExpect {
            status { isOk() }
            jsonPath("$") { isArray() }
            jsonPath("$[0].syncId") { value(testSyncId.toString()) }
            jsonPath("$[0].status") { value("completed") }
        }
    }

    @Test
    fun `GET email-syncs returns empty list when no syncs`() {
        `when`(syncRepo.findAllByUserIdOrderByStartedAtDesc(testUserId)).thenReturn(emptyList())

        mvc.get("/email-syncs") {
            header("Authorization", "Bearer $validToken")
        }.andExpect {
            status { isOk() }
            jsonPath("$.length()") { value(0) }
        }
    }

    // ── GET /email-syncs/{syncId} ────────────────────────────────────────────

    @Test
    fun `GET email-syncs by id without auth returns 401`() {
        mvc.get("/email-syncs/$testSyncId").andExpect {
            status { isUnauthorized() }
        }
    }

    @Test
    fun `GET email-syncs by id not found returns 404`() {
        `when`(syncRepo.findBySyncIdAndUserId(testSyncId, testUserId)).thenReturn(null)

        mvc.get("/email-syncs/$testSyncId") {
            header("Authorization", "Bearer $validToken")
        }.andExpect {
            status { isNotFound() }
        }
    }

    @Test
    fun `GET email-syncs by id with invalid UUID returns 404`() {
        mvc.get("/email-syncs/not-a-uuid") {
            header("Authorization", "Bearer $validToken")
        }.andExpect {
            status { isNotFound() }
        }
    }

    @Test
    fun `GET email-syncs by id happy path returns sync`() {
        val sync = EmailSync(
            syncId = testSyncId,
            userId = testUserId,
            status = "completed",
            emailsFetched = 10,
            emailsProcessed = 3,
        )
        `when`(syncRepo.findBySyncIdAndUserId(testSyncId, testUserId)).thenReturn(sync)

        mvc.get("/email-syncs/$testSyncId") {
            header("Authorization", "Bearer $validToken")
        }.andExpect {
            status { isOk() }
            jsonPath("$.syncId") { value(testSyncId.toString()) }
            jsonPath("$.status") { value("completed") }
            jsonPath("$.emailsFetched") { value(10) }
            jsonPath("$.emailsProcessed") { value(3) }
        }
    }
}
