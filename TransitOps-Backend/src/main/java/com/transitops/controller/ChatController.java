package com.transitops.controller;

import com.transitops.dto.ChatRequest;
import com.transitops.dto.ChatResponse;
import com.transitops.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public ResponseEntity<ChatResponse> askChatbot(@RequestBody ChatRequest request) {
        return ResponseEntity.ok(chatService.processMessage(request));
    }
}
