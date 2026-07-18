package com.calmanchor.calmanchor_api.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin
@RestController
public class OpenApiController {

    @GetMapping(value = "/v3/api-docs", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> getOpenApiDocument() {
        return orderedMap(
                "openapi", "3.0.3",
                "info", orderedMap(
                        "title", "CalmAnchor Lite API",
                        "version", "1.0.0",
                        "description", "Doctor, patient, appointment, and schedule endpoints for the CalmAnchor Lite assessment."
                ),
                "servers", List.of(orderedMap(
                        "url", "http://localhost:8081",
                        "description", "Local development server"
                )),
                "tags", List.of(
                        orderedMap("name", "Health"),
                        orderedMap("name", "Seed Data"),
                        orderedMap("name", "Doctor"),
                        orderedMap("name", "Patients"),
                        orderedMap("name", "Appointments"),
                        orderedMap("name", "Schedule")
                ),
                "paths", paths(),
                "components", orderedMap("schemas", schemas())
        );
    }

    private Map<String, Object> paths() {
        return orderedMap(
                "/api/health", orderedMap(
                        "get", operation("Health", "Returns API status and current data counts.", "Health",
                                List.of(), null,
                                responses("200", response("API health response.", ref("ApiHealthResponse"))))
                ),
                "/api/seed", orderedMap(
                        "post", operation("Seed baseline data", "Recreates the baseline doctor, five patients, and sample appointments.", "Seed Data",
                                List.of(), null,
                                responses("201", response("Seeded API health response.", ref("ApiHealthResponse"))))
                ),
                "/api/doctor", orderedMap(
                        "get", operation("Get doctor", "Returns the single doctor profile.", "Doctor",
                                List.of(), null,
                                responses("200", response("Doctor profile.", ref("Doctor")))),
                        "put", operation("Update doctor", "Updates the single doctor profile.", "Doctor",
                                List.of(), requestBody(ref("Doctor")),
                                standardWriteResponses("Doctor profile updated.", ref("Doctor")))
                ),
                "/api/patients", orderedMap(
                        "get", operation("List patients", "Returns all patients for the active doctor.", "Patients",
                                List.of(), null,
                                responses("200", response("Patient list.", arrayOf(ref("Patient"))))),
                        "post", operation("Create patient", "Creates a patient for the active doctor.", "Patients",
                                List.of(), requestBody(ref("Patient")),
                                standardWriteResponses("Patient created.", ref("Patient"), "201"))
                ),
                "/api/patients/{patientId}", orderedMap(
                        "get", operation("Get patient", "Returns one patient by ID.", "Patients",
                                List.of(pathParameter("patientId", "Patient ID.")), null,
                                responses(
                                        "200", response("Patient found.", ref("Patient")),
                                        "404", errorResponse("Patient was not found.")
                                )),
                        "put", operation("Update patient", "Updates one patient by ID.", "Patients",
                                List.of(pathParameter("patientId", "Patient ID.")), requestBody(ref("Patient")),
                                standardWriteResponses("Patient updated.", ref("Patient"))),
                        "delete", operation("Delete patient", "Deletes one patient and their appointments.", "Patients",
                                List.of(pathParameter("patientId", "Patient ID.")), null,
                                responses(
                                        "204", orderedMap("description", "Patient deleted."),
                                        "404", errorResponse("Patient was not found.")
                                ))
                ),
                "/api/appointments", orderedMap(
                        "get", operation("List appointments", "Returns all appointments for the active doctor.", "Appointments",
                                List.of(), null,
                                responses("200", response("Appointment list.", arrayOf(ref("Appointment"))))),
                        "post", operation("Create appointment", "Creates an appointment if the selected slot is free.", "Appointments",
                                List.of(), requestBody(ref("Appointment")),
                                appointmentWriteResponses("Appointment created.", "201"))
                ),
                "/api/appointments/{appointmentId}", orderedMap(
                        "get", operation("Get appointment", "Returns one appointment by ID.", "Appointments",
                                List.of(pathParameter("appointmentId", "Appointment ID.")), null,
                                responses(
                                        "200", response("Appointment found.", ref("Appointment")),
                                        "404", errorResponse("Appointment was not found.")
                                )),
                        "put", operation("Update appointment", "Updates one appointment if the selected slot is free.", "Appointments",
                                List.of(pathParameter("appointmentId", "Appointment ID.")), requestBody(ref("Appointment")),
                                appointmentWriteResponses("Appointment updated.", "200")),
                        "delete", operation("Delete appointment", "Deletes one appointment.", "Appointments",
                                List.of(pathParameter("appointmentId", "Appointment ID.")), null,
                                responses(
                                        "204", orderedMap("description", "Appointment deleted."),
                                        "404", errorResponse("Appointment was not found.")
                                ))
                ),
                "/api/appointments/{appointmentId}/slot", orderedMap(
                        "patch", operation("Move appointment slot", "Moves an appointment to another available slot.", "Appointments",
                                List.of(pathParameter("appointmentId", "Appointment ID.")), requestBody(ref("AppointmentSlotUpdateRequest")),
                                appointmentWriteResponses("Appointment moved.", "200"))
                ),
                "/api/schedule", orderedMap(
                        "get", operation("Get schedule", "Returns generated 20-minute slots with appointment data merged in.", "Schedule",
                                List.of(queryParameter("date", "Schedule date in yyyy-MM-dd format.", "2026-08-01")), null,
                                responses("200", response("Day schedule.", ref("DayScheduleResponse"))))
                ),
                "/api/schedule/available-slots", orderedMap(
                        "get", operation("Get available slots", "Returns slots available for the change appointment form.", "Schedule",
                                List.of(
                                        queryParameter("date", "Schedule date in yyyy-MM-dd format.", "2026-08-01"),
                                        optionalQueryParameter("currentAppointmentId", "Current appointment ID to keep its slot selectable.")
                                ), null,
                                responses("200", response("Available schedule slots.", arrayOf(ref("ScheduleSlot")))))
                )
        );
    }

    private Map<String, Object> schemas() {
        return orderedMap(
                "ApiHealthResponse", objectSchema(
                        property("status", stringExample("ok")),
                        property("dataMode", stringExample("seed")),
                        property("patientCount", integerExample(5)),
                        property("appointmentCount", integerExample(3)),
                        property("scheduleSlotCount", integerExample(24))
                ),
                "ApiErrorResponse", objectSchema(
                        property("timestamp", stringExample("2026-07-18T16:00:00Z")),
                        property("status", integerExample(409)),
                        property("error", stringExample("Conflict")),
                        property("message", stringExample("Slot already booked: 09:40")),
                        property("path", stringExample("/api/appointments"))
                ),
                "Doctor", objectSchema(
                        property("id", stringExample("doctor-001")),
                        property("fullName", stringExample("Dr. Amara Okafor")),
                        property("specialty", stringExample("General Practice")),
                        property("clinicName", stringExample("CalmAnchor Clinic")),
                        property("workingDayStart", stringExample("09:00")),
                        property("workingDayEnd", stringExample("17:00")),
                        property("slotLengthMinutes", integerExample(20)),
                        property("createdAt", stringExample("2026-07-18T16:00:00Z")),
                        property("updatedAt", stringExample("2026-07-18T16:00:00Z"))
                ),
                "Patient", objectSchema(
                        property("id", stringExample("patient-001")),
                        property("doctorId", stringExample("doctor-001")),
                        property("fullName", stringExample("Maya Thompson")),
                        property("dateOfBirth", stringExample("1991-04-12")),
                        property("phoneNumber", stringExample("+44 7700 900123")),
                        property("historyNotes", stringExample("Mild asthma")),
                        property("careNotes", stringExample("Prefers morning appointments")),
                        property("createdAt", stringExample("2026-07-18T16:00:00Z")),
                        property("updatedAt", stringExample("2026-07-18T16:00:00Z"))
                ),
                "Appointment", objectSchema(
                        property("id", stringExample("appointment-001")),
                        property("doctorId", stringExample("doctor-001")),
                        property("patientId", stringExample("patient-001")),
                        property("appointmentDate", stringExample("2026-08-01")),
                        property("slotStart", stringExample("09:00")),
                        property("slotEnd", stringExample("09:20")),
                        property("status", orderedMap("type", "string", "enum", List.of("BOOKED", "COMPLETED", "NO_SHOW"), "example", "BOOKED")),
                        property("reason", stringExample("Follow-up")),
                        property("notes", stringExample("Review care plan")),
                        property("createdAt", stringExample("2026-07-18T16:00:00Z")),
                        property("updatedAt", stringExample("2026-07-18T16:00:00Z"))
                ),
                "AppointmentSlotUpdateRequest", objectSchema(
                        property("appointmentDate", stringExample("2026-08-01")),
                        property("slotStart", stringExample("09:20")),
                        property("slotEnd", stringExample("09:40"))
                ),
                "ScheduleSlot", objectSchema(
                        property("start", stringExample("09:00")),
                        property("end", stringExample("09:20")),
                        property("available", orderedMap("type", "boolean", "example", false)),
                        property("appointment", nullableRef("Appointment")),
                        property("patient", nullableRef("Patient"))
                ),
                "DayScheduleResponse", objectSchema(
                        property("doctor", ref("Doctor")),
                        property("appointmentDate", stringExample("2026-08-01")),
                        property("slots", arrayOf(ref("ScheduleSlot")))
                )
        );
    }

    private Map<String, Object> operation(String operationId, String summary, String tag,
                                          List<Map<String, Object>> parameters,
                                          Map<String, Object> requestBody,
                                          Map<String, Object> responses) {
        Map<String, Object> operation = orderedMap(
                "operationId", operationId,
                "tags", List.of(tag),
                "summary", summary,
                "responses", responses
        );

        if (!parameters.isEmpty()) {
            operation.put("parameters", parameters);
        }

        if (requestBody != null) {
            operation.put("requestBody", requestBody);
        }

        return operation;
    }

    private Map<String, Object> standardWriteResponses(String successDescription, Map<String, Object> schema) {
        return standardWriteResponses(successDescription, schema, "200");
    }

    private Map<String, Object> standardWriteResponses(String successDescription, Map<String, Object> schema, String successStatus) {
        return responses(
                successStatus, response(successDescription, schema),
                "400", errorResponse("Request body failed validation.")
        );
    }

    private Map<String, Object> appointmentWriteResponses(String successDescription, String successStatus) {
        return responses(
                successStatus, response(successDescription, ref("Appointment")),
                "400", errorResponse("Request body failed validation."),
                "404", errorResponse("Patient or appointment was not found."),
                "409", errorResponse("Appointment slot is already booked.")
        );
    }

    private Map<String, Object> response(String description, Map<String, Object> schema) {
        return orderedMap(
                "description", description,
                "content", orderedMap(
                        "application/json", orderedMap("schema", schema)
                )
        );
    }

    private Map<String, Object> errorResponse(String description) {
        return response(description, ref("ApiErrorResponse"));
    }

    private Map<String, Object> requestBody(Map<String, Object> schema) {
        return orderedMap(
                "required", true,
                "content", orderedMap(
                        "application/json", orderedMap("schema", schema)
                )
        );
    }

    private Map<String, Object> responses(Object... values) {
        return orderedMap(values);
    }

    private Map<String, Object> pathParameter(String name, String description) {
        return parameter(name, "path", true, description, stringExample("appointment-001"));
    }

    private Map<String, Object> queryParameter(String name, String description, String example) {
        return parameter(name, "query", false, description, stringExample(example));
    }

    private Map<String, Object> optionalQueryParameter(String name, String description) {
        return parameter(name, "query", false, description, stringExample("appointment-001"));
    }

    private Map<String, Object> parameter(String name, String location, boolean required, String description, Map<String, Object> schema) {
        return orderedMap(
                "name", name,
                "in", location,
                "required", required,
                "description", description,
                "schema", schema
        );
    }

    private Map.Entry<String, Object> property(String name, Map<String, Object> schema) {
        return Map.entry(name, schema);
    }

    @SafeVarargs
    private Map<String, Object> objectSchema(Map.Entry<String, Object>... properties) {
        Map<String, Object> propertyMap = new LinkedHashMap<>();
        List<String> required = new ArrayList<>();

        for (Map.Entry<String, Object> property : properties) {
            propertyMap.put(property.getKey(), property.getValue());
            if (!List.of("createdAt", "updatedAt", "reason", "notes", "appointment", "patient").contains(property.getKey())) {
                required.add(property.getKey());
            }
        }

        return orderedMap(
                "type", "object",
                "required", required,
                "properties", propertyMap
        );
    }

    private Map<String, Object> ref(String schemaName) {
        return orderedMap("$ref", "#/components/schemas/" + schemaName);
    }

    private Map<String, Object> nullableRef(String schemaName) {
        return orderedMap("allOf", List.of(ref(schemaName)), "nullable", true);
    }

    private Map<String, Object> arrayOf(Map<String, Object> itemSchema) {
        return orderedMap("type", "array", "items", itemSchema);
    }

    private Map<String, Object> stringExample(String example) {
        return orderedMap("type", "string", "example", example);
    }

    private Map<String, Object> integerExample(int example) {
        return orderedMap("type", "integer", "format", "int32", "example", example);
    }

    private Map<String, Object> orderedMap(Object... values) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int index = 0; index < values.length; index += 2) {
            map.put((String) values[index], values[index + 1]);
        }
        return map;
    }
}
