import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CreateBook from './CreateBook';
import Books from './Books';
import UpdateBook from './Updatebook';
import Nav from './Nav';

function App() {
  return (
    <>
      <BrowserRouter>
        <Nav />
        <main style={{ paddingTop: '80px', minHeight: 'calc(100vh - 80px)' }}>
          <Routes>
            <Route path="/" element={<Books />} />
            <Route path="/create" element={<CreateBook />} />
            <Route path="/update/:id" element={<UpdateBook />} />
          </Routes>
        </main>
      </BrowserRouter>
    </>
  );
}

export default App;
