package com.transitops.repository;

import com.transitops.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByVehicleId(Long vehicleId);
}
