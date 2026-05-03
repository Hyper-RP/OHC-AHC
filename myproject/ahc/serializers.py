from rest_framework import serializers

from ahc.models import Hospital, MedicalReport, Referral


class HospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = "__all__"
        read_only_fields = ("id", "uuid", "created_at", "updated_at")


class ReferralSerializer(serializers.ModelSerializer):
    class Meta:
        model = Referral
        fields = "__all__"
        read_only_fields = ("id", "uuid", "created_at", "updated_at")

    def validate(self, attrs):
        request = self.context["request"]
        if request.user.role in {request.user.Role.DOCTOR, request.user.Role.NURSE}:
            doctor_profile = getattr(request.user, "doctor_profile", None)
            if doctor_profile and not attrs.get("referred_by"):
                attrs["referred_by"] = doctor_profile
        if attrs.get("visit") and not attrs.get("employee"):
            attrs["employee"] = attrs["visit"].employee
        return attrs


class MedicalReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalReport
        fields = "__all__"
        read_only_fields = ("id", "uuid", "created_at", "updated_at")

    def validate(self, attrs):
        if not attrs.get("employee") and attrs.get("referral"):
            attrs["employee"] = attrs["referral"].employee
        if not attrs.get("hospital") and attrs.get("referral"):
            attrs["hospital"] = attrs["referral"].hospital
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        validated_data["uploaded_by"] = request.user
        return super().create(validated_data)
