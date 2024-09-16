import alertTelegram from './telegram';
import alertEmail from './email';

export default async function sendAllAlerts(message: string): Promise<void> {
    await Promise.all([
        alertTelegram( message ),
        alertEmail( message )
    ]);
}