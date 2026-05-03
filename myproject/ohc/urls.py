from rest_framework.routers import DefaultRouter
from django.urls import include, path

from ohc.views import CompleteOHCIntakeAPIView, DiagnosisPrescriptionAPIView, MedicalTestViewSet, OHCVisitViewSet

router = DefaultRouter()
router.register("visits", OHCVisitViewSet, basename="ohc-visit")
router.register("medical-tests", MedicalTestViewSet, basename="medical-test")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "diagnosis-prescriptions/",
        DiagnosisPrescriptionAPIView.as_view(),
        name="diagnosis-prescription-create",
    ),
    path(
        "complete-intake/",
        CompleteOHCIntakeAPIView.as_view(),
        name="complete-ohc-intake",
    ),
]
