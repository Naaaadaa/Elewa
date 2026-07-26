import { useState } from 'react';
import { LanguageProvider } from './LanguageContext';
import { PhoneFrame } from './components';
import SignIn from './screens/SignIn';
import LanguageOverlay from './screens/LanguageOverlay';
import TeacherApp from './screens/teacher/TeacherApp';
import ParentApp from './screens/parent/ParentApp';

export default function App() {
  return (
    <LanguageProvider>
      <PhoneFrame>
        <Root />
        {/* Blocking overlay while translate_ui runs, or if it fails. */}
        <LanguageOverlay />
      </PhoneFrame>
    </LanguageProvider>
  );
}

function Root() {
  const [user, setUser] = useState(null);

  if (!user) return <SignIn onSignedIn={setUser} />;

  return user.role === 'teacher' ? (
    <TeacherApp user={user} onSignOut={() => setUser(null)} />
  ) : (
    <ParentApp user={user} onSignOut={() => setUser(null)} />
  );
}
