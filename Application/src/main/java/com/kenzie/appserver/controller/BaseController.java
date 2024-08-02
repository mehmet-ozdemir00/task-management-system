package com.kenzie.appserver.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * A base controller for handling root-level HTTP requests.
 * This controller provides a simple endpoint to retrieve the
 * service name or status of the application.
 */
@RestController
public class BaseController {
    @GetMapping("/")
    public ResponseEntity getServiceName() {
        ResponseEntity responseEntity = new ResponseEntity(HttpStatus.OK);
        return responseEntity;
    }
}