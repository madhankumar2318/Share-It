package com.shareit;

import com.cloudinary.Cloudinary;
import com.shareit.config.CloudinaryConfig;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CloudinaryConfigTest {

    @Test
    void whenCredentialsEmpty_returnsEmptyOptional() {
        CloudinaryConfig config = new CloudinaryConfig();
        Optional<Cloudinary> bean = config.cloudinary();
        assertFalse(bean.isPresent(), "Should be empty when credentials are not configured");
    }

    @Test
    void whenCredentialsProvided_returnsConfiguredCloudinary() {
        CloudinaryConfig config = new CloudinaryConfig();
        ReflectionTestUtils.setField(config, "cloudName", "ti1pdknj");
        ReflectionTestUtils.setField(config, "apiKey", "696999518123512");
        ReflectionTestUtils.setField(config, "apiSecret", "iJvthfKv2JgOBnUZ4ppwnxKbdyQ");

        Optional<Cloudinary> bean = config.cloudinary();
        assertTrue(bean.isPresent(), "Should configure Cloudinary when credentials are provided");
    }

    @Test
    void whenCloudinaryUrlProvided_returnsConfiguredCloudinary() {
        CloudinaryConfig config = new CloudinaryConfig();
        ReflectionTestUtils.setField(config, "cloudinaryUrl", "cloudinary://696999518123512:iJvthfKv2JgOBnUZ4ppwnxKbdyQ@ti1pdknj");

        Optional<Cloudinary> bean = config.cloudinary();
        assertTrue(bean.isPresent(), "Should configure Cloudinary when CLOUDINARY_URL is provided");
    }
}
