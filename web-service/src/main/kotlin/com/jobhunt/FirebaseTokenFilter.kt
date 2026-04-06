package com.jobhunt

import com.google.firebase.auth.FirebaseAuth
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class FirebaseTokenFilter(private val firebaseAuth: FirebaseAuth) : OncePerRequestFilter() {

    override fun shouldNotFilter(request: HttpServletRequest) =
        request.method.equals("OPTIONS", ignoreCase = true)

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val authHeader = request.getHeader("Authorization")
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            val token = authHeader.removePrefix("Bearer ")
            try {
                val decodedToken = firebaseAuth.verifyIdToken(token)
                val authentication = UsernamePasswordAuthenticationToken(
                    decodedToken.uid,
                    null,
                    emptyList(),
                )
                SecurityContextHolder.getContext().authentication = authentication
            } catch (_: Exception) {
                // Invalid token — leave SecurityContext empty; security config will return 401
            }
        }
        filterChain.doFilter(request, response)
    }
}
