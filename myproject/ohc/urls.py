from rest_framework.routers import DefaultRouter
from django.urls import include, path

from ohc.views import (
    AnalyticsViewSet,
    CompleteOHCIntakeAPIView,
    DiagnosisPrescriptionAPIView,
    MedicineStockViewSet,
    MedicalTestViewSet,
    MedicineSummaryViewSet,
    OHCVisitViewSet,
    PrescriptionListViewSet,
)

router = DefaultRouter()
router.register("visits", OHCVisitViewSet, basename="ohc-visit")
router.register("medical-tests", MedicalTestViewSet, basename="medical-test")
router.register("medicines", MedicineStockViewSet, basename="medicine-stock")
router.register("analytics", AnalyticsViewSet, basename="analytics")
router.register("medicine-summary", MedicineSummaryViewSet, basename="medicine-summary")
router.register("prescriptions", PrescriptionListViewSet, basename="pharmacist-prescription")

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
