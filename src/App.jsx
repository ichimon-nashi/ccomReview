import { useState, useEffect, useRef } from 'react';
import './index.css';
import data from './data';
import beepSound from './assets/beep-0s.mp3';

function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [timerActive, setTimerActive] = useState(false);
  const [shuffledData, setShuffledData] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  
  // Audio ref
  const audioRef = useRef(null);
  
  // Settings
  const [timerDuration, setTimerDuration] = useState(10);
  const [selectedChapters, setSelectedChapters] = useState({
    '0': true, '1': true, '2': true, '3': true, '4': true, '5': true,
    '6': true, '7': true, '8': true, '9': true, '10': true, '11': true, '附錄': true
  });
  const [quizMode, setQuizMode] = useState('ALL'); // ALL, CHAPTER, TITLE

  const allChapters = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '附錄'];

  // Prepare questions when settings change (but don't start game)
  useEffect(() => {
    prepareQuestions();
  }, [selectedChapters, quizMode]);

  const prepareQuestions = () => {
    // Filter by selected chapters
    const filtered = data.filter(item => {
      const chapterNum = item.chapter.split('.')[0];
      return selectedChapters[chapterNum];
    });

    if (filtered.length === 0) {
      setShuffledData([]);
      return;
    }

    // Create question objects based on quiz mode
    let questionPool = [];
    
    filtered.forEach(item => {
      if (quizMode === 'ALL') {
        // 50/50 chance for each item to be chapter or title question
        if (Math.random() < 0.5) {
          questionPool.push({ question: item.chapter, answer: item.title, type: 'chapter' });
        } else {
          questionPool.push({ question: item.title, answer: item.chapter, type: 'title' });
        }
      } else if (quizMode === 'CHAPTER') {
        // Only chapter questions
        questionPool.push({ question: item.chapter, answer: item.title, type: 'chapter' });
      } else if (quizMode === 'TITLE') {
        // Only title questions
        questionPool.push({ question: item.title, answer: item.chapter, type: 'title' });
      }
    });

    // Shuffle the pool
    const shuffled = questionPool.sort(() => Math.random() - 0.5);
    setShuffledData(shuffled);
  };

  // Play beep sound
  const playBeep = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.log('Audio play failed:', err));
    }
  };

  // Timer effect
  useEffect(() => {
    let interval;
    if (timerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            playBeep(); // Play sound ONLY when timer reaches 0
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeRemaining]);

  const startGame = () => {
    if (shuffledData.length === 0) return;
    setGameStarted(true);
    setCurrentIndex(0);
    setShowAnswer(false);
    setTimeRemaining(timerDuration);
    setTimerActive(true);
  };

  const handleNext = () => {
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev + 1) % shuffledData.length);
    setTimeRemaining(timerDuration);
    setTimerActive(true); // Auto-start timer
  };

  const handlePrevious = () => {
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev - 1 + shuffledData.length) % shuffledData.length);
    setTimeRemaining(timerDuration);
    setTimerActive(false);
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
    if (!showAnswer) {
      setTimerActive(false);
    }
  };

  const stopTimer = () => {
    setTimerActive(false);
  };

  const handleChapterToggle = (chapter) => {
    setSelectedChapters(prev => ({
      ...prev,
      [chapter]: !prev[chapter]
    }));
  };

  const selectAllChapters = () => {
    const allSelected = {};
    allChapters.forEach(ch => allSelected[ch] = true);
    setSelectedChapters(allSelected);
  };

  const deselectAllChapters = () => {
    const noneSelected = {};
    allChapters.forEach(ch => noneSelected[ch] = false);
    setSelectedChapters(noneSelected);
  };

  const hasSelectedChapters = Object.values(selectedChapters).some(val => val);
  const currentItem = shuffledData[currentIndex];

  return (
    <div className="container">
      {/* Audio element */}
      <audio ref={audioRef} src={beepSound} preload="auto" />
      
      <div className="game-layout">
        {/* Left Sidebar - Settings */}
        <div className="settings-sidebar">
          <h3 className="settings-title">⚙️ Settings</h3>
          
          <div className="setting-group-compact">
            <label>Timer (sec)</label>
            <input 
              type="number" 
              value={timerDuration}
              onChange={(e) => setTimerDuration(Number(e.target.value))}
              min="5"
              max="60"
              className="input-compact"
            />
          </div>
          
          <div className="setting-group-compact">
            <label>Quiz Mode</label>
            <select value={quizMode} onChange={(e) => setQuizMode(e.target.value)} className="select-compact">
              <option value="ALL">Random</option>
              <option value="CHAPTER">Chapter → Title</option>
              <option value="TITLE">Title → Chapter</option>
            </select>
          </div>

          <div className="setting-group-compact">
            <label>Chapters</label>
            <div className="chapter-actions-compact">
              <button className="btn-tiny" onClick={selectAllChapters}>All</button>
              <button className="btn-tiny" onClick={deselectAllChapters}>None</button>
            </div>
            <div className="checkbox-compact">
              {allChapters.map(chapter => (
                <label key={chapter} className="checkbox-label-compact">
                  <input
                    type="checkbox"
                    checked={selectedChapters[chapter]}
                    onChange={() => handleChapterToggle(chapter)}
                  />
                  <span>{chapter}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="game-area">
          <h1 className="game-title">新生用CCOM抽問</h1>
          
          {!hasSelectedChapters ? (
            <div className="warning-box">
              <p>⚠️ Please select at least one chapter</p>
            </div>
          ) : !gameStarted ? (
            <div className="start-screen">
              <div className="start-info">
                <p className="ready-count">{shuffledData.length} questions ready</p>
                <p className="ready-mode">Mode: {quizMode === 'ALL' ? 'Random' : quizMode === 'CHAPTER' ? 'Chapter → Title' : 'Title → Chapter'}</p>
              </div>
              <button className="btn-start" onClick={startGame}>
                🚀 開始抽問
              </button>
            </div>
          ) : (
            <>
              {/* Timer and Counter */}
              <div className="game-header">
                <div className="timer-display">
                  <div className={`timer-circle ${timeRemaining <= 3 ? 'timer-warning' : ''}`}>
                    {timeRemaining}
                  </div>
                  <div className="timer-controls">
                    <button className="btn-timer-control stop" onClick={stopTimer}>⏸</button>
                  </div>
                </div>
                
                <div className="progress-display">
                  <span className="progress-text">{currentIndex + 1} / {shuffledData.length}</span>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${((currentIndex + 1) / shuffledData.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Question Card */}
              <div className="question-card">
                <div className="question-type-badge">
                  {currentItem.type === 'chapter' ? '📖 Chapter' : '📝 Title'}
                </div>
                <div className="question-content">
                  <h2>{currentItem.question}</h2>
                </div>

                {showAnswer && (
                  <div className="answer-reveal">
                    <div className="answer-label">Answer:</div>
                    <div className="answer-content">{currentItem.answer}</div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="game-controls">
                <button className="btn-control" onClick={handlePrevious}>
                  ← Prev
                </button>
                
                <button className="btn-control btn-primary" onClick={toggleAnswer}>
                  {showAnswer ? '🙈 Hide' : '👁️ Show'}
                </button>
                
                <button className="btn-control" onClick={handleNext}>
                  Next →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;