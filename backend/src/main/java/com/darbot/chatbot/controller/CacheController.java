package com.darbot.chatbot.controller;

import com.darbot.chatbot.service.CacheService;
import com.github.benmanes.caffeine.cache.Cache;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.CacheManager;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/cache")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class CacheController {

    private final CacheService cacheService;
    private final CacheManager cacheManager;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> obtenerEstadisticas() {
        Map<String, Object> stats = new HashMap<>();
        
        for (String cacheName : new String[]{"chatbot_respuestas", "chatbot_intenciones", "chatbot_faq"}) {
            var cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                var nativeCache = cache.getNativeCache();
                if (nativeCache instanceof Cache<?, ?>) {
                    var caffeineCache = (Cache<?, ?>) nativeCache;
                    stats.put(cacheName, Map.of(
                        "size", caffeineCache.estimatedSize()
                    ));
                }
            }
        }

        return ResponseEntity.ok(stats);
    }

    @DeleteMapping("/clear")
    public ResponseEntity<Void> limpiarCache() {
        cacheService.limpiarCache();
        return ResponseEntity.ok().build();
    }
}