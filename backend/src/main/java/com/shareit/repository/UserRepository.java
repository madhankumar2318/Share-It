package com.shareit.repository;

import com.shareit.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);

    @Query("SELECT COUNT(u) > 0 FROM User u WHERE REPLACE(REPLACE(REPLACE(u.phone, ' ', ''), '-', ''), '+91', '') = :tenDigits")
    boolean existsByNormalizedPhone(@Param("tenDigits") String tenDigits);
}
