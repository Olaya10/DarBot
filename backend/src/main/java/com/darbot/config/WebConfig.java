package com.darbot.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve uploaded gallery files
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/gallery/");

        // Serve admin UI partials and related static files
        registry.addResourceHandler("/admin/**")
                .addResourceLocations("file:frontend/admin/")
                .setCachePeriod(3600);

        // Serve gallery images referenced in the UI
        registry.addResourceHandler("/imagenes/**")
                .addResourceLocations("file:frontend/imagenes/")
                .setCachePeriod(3600);
    }
}
