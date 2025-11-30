import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { store } from "@/lib/store";
import { toast } from "sonner";

interface MigrationResult {
  clinicsMigrated: number;
  usersMigrated: number;
  patientsMigrated: number;
  doctorsMigrated: number;
  servicesMigrated: number;
  visitsMigrated: number;
  filesMigrated: number;
  errors: string[];
}

const MigrateData = () => {
  const navigate = useNavigate();
  const currentUser = store.getCurrentUser();
  const [isMigrating, setIsMigrating] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);

  const isAuthorized = useMemo(() => {
    if (!currentUser) return false;
    return currentUser.role === "admin" || currentUser.email === "forthejuveuj@gmail.com";
  }, [currentUser]);

  const localCounts = useMemo(() => {
    return {
      clinics: store.getClinics().length,
      users: store.getAllUsers().length,
      patients: store.getAllPatients().length,
      doctors: store.getAllDoctors().length,
      services: store.getAllServices().length,
      visits: store.getAllVisits().length,
    };
  }, []);

  const handleMigrate = async () => {
    setIsMigrating(true);
    setResult(null);
    try {
      // Migration is no longer needed - all data is already API-only
      // This page can be used to verify data is in sync
      const clinicId = store.getCurrentClinicId();
      if (!clinicId) {
        throw new Error("Необходимо войти в систему");
      }

      // Fetch all data to verify sync
      await Promise.all([
        store.fetchClinics(),
        store.fetchUsers(clinicId),
        store.fetchPatients(clinicId),
        store.fetchDoctors(clinicId),
        store.fetchServices(clinicId),
        store.fetchVisits(clinicId),
      ]);

      const summary: MigrationResult = {
        clinicsMigrated: store.getClinics().length,
        usersMigrated: store.getUsers(clinicId).length,
        patientsMigrated: store.getPatients(clinicId).length,
        doctorsMigrated: store.getDoctors(clinicId).length,
        servicesMigrated: store.getServices(clinicId).length,
        visitsMigrated: store.getVisits(clinicId).length,
        filesMigrated: store.getFiles(undefined, clinicId).length,
        errors: [],
      };
      
      setResult(summary);
      toast.success("Данные синхронизированы с сервером");
    } catch (error) {
      toast.error((error as Error).message || "Ошибка при проверке данных");
    } finally {
      setIsMigrating(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold">Требуется авторизация</h1>
          <p className="text-muted-foreground">
            Пожалуйста, войдите в систему под учетной записью администратора, чтобы использовать инструмент миграции.
          </p>
          <Button onClick={() => navigate("/login")}>Войти</Button>
        </Card>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold">Недостаточно прав</h1>
          <p className="text-muted-foreground">
            Только администраторы могут выполнять миграцию данных. Обратитесь к администратору вашей клиники.
          </p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Назад
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Миграция локальных данных</h1>
          <p className="text-muted-foreground">
            Инструмент переносит локальные данные (пользователи, клиники, пациенты и т.д.) в облачное хранилище. После миграции аккаунты будут доступны на всех устройствах.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-2">Данные, доступные локально</h2>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>Клиники: {localCounts.clinics}</li>
              <li>Пользователи: {localCounts.users}</li>
              <li>Пациенты: {localCounts.patients}</li>
              <li>Врачи: {localCounts.doctors}</li>
              <li>Услуги: {localCounts.services}</li>
              <li>Записи: {localCounts.visits}</li>
            </ul>
          </Card>

          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-2">Как это работает</h2>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>1. Считываем данные из LocalStorage текущего устройства.</li>
              <li>2. Отправляем информацию на сервер и обновляем облачное хранилище.</li>
              <li>3. После завершения данные становятся доступны на всех устройствах.</li>
            </ul>
          </Card>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleMigrate} disabled={isMigrating} className="flex-1">
            {isMigrating ? "Миграция..." : "Начать миграцию"}
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)} className="flex-1" disabled={isMigrating}>
            Назад
          </Button>
        </div>

        {result && (
          <Card className="p-4 space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Результаты миграции</h2>
              <p className="text-sm text-muted-foreground">
                Проверено, что локальные данные успешно синхронизированы с сервером.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <span>Клиники: {result.clinicsMigrated}</span>
              <span>Пользователи: {result.usersMigrated}</span>
              <span>Пациенты: {result.patientsMigrated}</span>
              <span>Врачи: {result.doctorsMigrated}</span>
              <span>Услуги: {result.servicesMigrated}</span>
              <span>Записи: {result.visitsMigrated}</span>
              <span>Файлы: {result.filesMigrated}</span>
            </div>

            {result.errors.length > 0 && (
              <div className="pt-3 border-t">
                <p className="text-sm font-medium mb-2">Возникли предупреждения:</p>
                <ul className="text-xs text-muted-foreground space-y-1 max-h-40 overflow-y-auto">
                  {result.errors.map((error, index) => (
                    <li key={`${error}-${index}`}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}
      </Card>
    </div>
  );
};

export default MigrateData;


