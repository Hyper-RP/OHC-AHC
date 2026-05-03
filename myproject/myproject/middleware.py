import json

from reports.services import log_audit_event


class APIAuditMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if request.path.startswith("/api/") and request.method in {"POST", "PUT", "PATCH", "DELETE"}:
            payload = {}
            if request.body:
                try:
                    payload = json.loads(request.body.decode("utf-8"))
                except (UnicodeDecodeError, json.JSONDecodeError):
                    payload = {"raw_body": "[non-json payload omitted]"}

            log_audit_event(
                actor=getattr(request, "user", None),
                module="API",
                action=request.method,
                target_model=request.path,
                object_snapshot={
                    "request_data": payload,
                    "response_status": getattr(response, "status_code", None),
                },
                ip_address=self._get_ip_address(request),
                user_agent=request.META.get("HTTP_USER_AGENT", ""),
                remarks="Automatic API audit log entry.",
            )
        return response

    def _get_ip_address(self, request):
        forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR")
