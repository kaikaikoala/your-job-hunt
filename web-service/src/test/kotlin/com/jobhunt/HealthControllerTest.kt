package com.jobhunt

import com.google.firebase.auth.FirebaseAuth
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.context.annotation.Import
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get

@WebMvcTest(HealthController::class)
@Import(SecurityConfig::class, FirebaseTokenFilter::class)
class HealthControllerTest {
    @Autowired
    lateinit var mvc: MockMvc

    @MockBean
    lateinit var firebaseAuth: FirebaseAuth

    @MockBean
    lateinit var userService: UserService

    @Test
    fun `GET health returns 200 without auth`() {
        mvc.get("/health").andExpect {
            status { isOk() }
            jsonPath("$.status") { value("ok") }
        }
    }
}
