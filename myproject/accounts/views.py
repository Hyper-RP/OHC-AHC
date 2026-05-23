from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated

from accounts.models import DoctorProfile
from accounts.serializers import CurrentUserSerializer, DoctorListSerializer


class CurrentUserAPIView(RetrieveAPIView):
    serializer_class = CurrentUserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class DoctorListAPIView(ListAPIView):
    serializer_class = DoctorListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DoctorProfile.objects.filter(
            user__role='DOCTOR',
            is_active_doctor=True
        ).select_related('user')
