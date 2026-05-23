from django.urls import path

from accounts.views import CurrentUserAPIView, DoctorListAPIView

urlpatterns = [
    path("me/", CurrentUserAPIView.as_view(), name="current-user"),
    path("doctors/", DoctorListAPIView.as_view(), name="doctors-list"),
]
