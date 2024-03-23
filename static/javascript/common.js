function create_log_item(component, component_id, action_type, action_value) {
    return {
        "timestamp": new Date().toLocaleString(),
        "component": component,
        "component_id": component,
        "action_type": action_type,
        "action_value": action_value
    }
}