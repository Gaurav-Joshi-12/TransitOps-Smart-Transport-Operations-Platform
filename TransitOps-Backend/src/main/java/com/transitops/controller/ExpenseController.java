package com.transitops.controller;

import com.transitops.entity.Expense;
import com.transitops.service.ExpenseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping
    public ResponseEntity<List<Expense>> getExpenses(@RequestParam(required = false) Long vehicleId) {
        return ResponseEntity.ok(expenseService.getExpenses(vehicleId));
    }

    @PostMapping
    public ResponseEntity<Expense> createExpense(@RequestBody Expense expense) {
        return ResponseEntity.ok(expenseService.createExpense(expense));
    }
}
