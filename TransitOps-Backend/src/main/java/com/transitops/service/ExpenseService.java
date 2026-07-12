package com.transitops.service;

import com.transitops.entity.Expense;
import com.transitops.entity.Vehicle;
import com.transitops.exception.ResourceNotFoundException;
import com.transitops.repository.ExpenseRepository;
import com.transitops.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final VehicleRepository vehicleRepository;

    public ExpenseService(ExpenseRepository expenseRepository, VehicleRepository vehicleRepository) {
        this.expenseRepository = expenseRepository;
        this.vehicleRepository = vehicleRepository;
    }

    public List<Expense> getExpenses(Long vehicleId) {
        if (vehicleId != null) {
            return expenseRepository.findByVehicleId(vehicleId);
        }
        return expenseRepository.findAll();
    }

    public Expense createExpense(Expense expense) {
        if (expense.getVehicle() != null && expense.getVehicle().getId() != null) {
            Vehicle v = vehicleRepository.findById(expense.getVehicle().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));
            expense.setVehicle(v);
        }
        return expenseRepository.save(expense);
    }
}
