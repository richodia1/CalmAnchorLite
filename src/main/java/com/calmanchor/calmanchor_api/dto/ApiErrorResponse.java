package com.calmanchor.calmanchor_api.dto;

public record ApiErrorResponse(
        String timestamp,
        int status,
        String error,
        String message,
        String path
) {
}

