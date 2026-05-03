from django.urls import include, path
from rest_framework.routers import DefaultRouter

from ahc.views import HospitalViewSet, MedicalReportViewSet, ReferralViewSet

router = DefaultRouter()
router.register("hospitals", HospitalViewSet, basename="hospital")
router.register("referrals", ReferralViewSet, basename="referral")
router.register("medical-reports", MedicalReportViewSet, basename="medical-report")

urlpatterns = [
    path("", include(router.urls)),
]
