package com.jobhunt

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseToken
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.context.annotation.Import
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import java.util.UUID

@WebMvcTest(ApplicationController::class)
@Import(SecurityConfig::class, FirebaseTokenFilter::class)
class ApplicationControllerTest {

    @Autowired
    lateinit var mvc: MockMvc

    @MockBean
    lateinit var firebaseAuth: FirebaseAuth

    @MockBean
    lateinit var userService: UserService

    @MockBean
    lateinit var repo: ApplicationRepository

    @MockBean
    lateinit var stageRepo: ApplicationStageRepository

    @MockBean
    lateinit var actionItemRepo: ActionItemRepository

    private val testFirebaseUid = "test-uid"
    private val testUserId = UUID.fromString("00000000-0000-0000-0000-000000000099")
    private val validToken = "valid-token"

    @BeforeEach
    fun setupAuth() {
        val mockToken = mock(FirebaseToken::class.java)
        `when`(mockToken.uid).thenReturn(testFirebaseUid)
        `when`(firebaseAuth.verifyIdToken(validToken)).thenReturn(mockToken)
        val testUser = User(userId = testUserId, firebaseUid = testFirebaseUid)
        `when`(userService.findOrCreate(testFirebaseUid)).thenReturn(testUser)
    }

    // ── POST /applications ───────────────────────────────────────────────────

    @Test
    fun `POST applications without auth returns 401`() {
        mvc.post("/applications") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"company":"Stripe","role":"Engineer"}"""
        }.andExpect {
            status { isUnauthorized() }
        }
    }

    @Test
    fun `POST applications with valid token creates application`() {
        val savedApp = JobApplication(
            appId = UUID.fromString("00000000-0000-0000-0000-000000000002"),
            userId = testUserId,
            company = "Stripe",
            role = "Engineer",
        )
        `when`(repo.save(org.mockito.ArgumentMatchers.any(JobApplication::class.java))).thenReturn(savedApp)

        mvc.post("/applications") {
            header("Authorization", "Bearer $validToken")
            contentType = MediaType.APPLICATION_JSON
            content = """{"company":"Stripe","role":"Engineer"}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.appId") { value("00000000-0000-0000-0000-000000000002") }
            jsonPath("$.company") { value("Stripe") }
            jsonPath("$.role") { value("Engineer") }
        }
    }

    @Test
    fun `POST applications with duplicate URL returns 409`() {
        `when`(repo.save(org.mockito.ArgumentMatchers.any(JobApplication::class.java)))
            .thenThrow(DataIntegrityViolationException("duplicate key"))

        mvc.post("/applications") {
            header("Authorization", "Bearer $validToken")
            contentType = MediaType.APPLICATION_JSON
            content = """{"company":"Stripe","role":"Engineer","jobPostingUrl":"https://stripe.com/jobs/1"}"""
        }.andExpect {
            status { isConflict() }
        }
    }

    // ── GET /applications ────────────────────────────────────────────────────

    @Test
    fun `GET applications without auth returns 401`() {
        mvc.get("/applications").andExpect {
            status { isUnauthorized() }
        }
    }

    @Test
    fun `GET applications with valid token returns empty list`() {
        `when`(repo.findAllByUserId(testUserId)).thenReturn(emptyList())

        mvc.get("/applications") {
            header("Authorization", "Bearer $validToken")
        }.andExpect {
            status { isOk() }
            jsonPath("$") { isArray() }
            jsonPath("$.length()") { value(0) }
        }
    }

    @Test
    fun `GET applications with valid token returns list of applications`() {
        val app = JobApplication(
            appId = UUID.fromString("00000000-0000-0000-0000-000000000001"),
            userId = testUserId,
            company = "Stripe",
            role = "Staff Engineer",
            jobPostingUrl = "https://stripe.com/jobs/1",
            salaryRange = "200k-250k",
        )
        `when`(repo.findAllByUserId(testUserId)).thenReturn(listOf(app))

        mvc.get("/applications") {
            header("Authorization", "Bearer $validToken")
        }.andExpect {
            status { isOk() }
            jsonPath("$[0].company") { value("Stripe") }
            jsonPath("$[0].role") { value("Staff Engineer") }
            jsonPath("$[0].appId") { value("00000000-0000-0000-0000-000000000001") }
        }
    }
}
