import { useState } from 'react';
import Classes from './Classes';
import CreateClass from './CreateClass';
import ClassScreen from './ClassScreen';

/** Teacher flow: My Classes -> create class -> inside a class. */
export default function TeacherApp({ user }) {
  const [view, setView] = useState('classes'); // 'classes' | 'create' | 'class'
  const [klass, setKlass] = useState(null);
  // Bumped after a class is created so the list refetches when we go back.
  const [listKey, setListKey] = useState(0);

  if (view === 'create') {
    return (
      <CreateClass
        teacherId={user.id}
        onBack={() => setView('classes')}
        onCreated={() => setListKey((k) => k + 1)}
        onOpenClass={(created) => {
          setKlass(created);
          setView('class');
        }}
      />
    );
  }

  if (view === 'class' && klass) {
    return <ClassScreen klass={klass} onBack={() => setView('classes')} />;
  }

  return (
    <Classes
      key={listKey}
      teacherId={user.id}
      onCreateClass={() => setView('create')}
      onOpenClass={(selected) => {
        setKlass(selected);
        setView('class');
      }}
    />
  );
}
