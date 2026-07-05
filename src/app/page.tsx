"use client";

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { User, Activity, Progress, Attestation } from '@prisma/client';
import { Trophy, CheckCircle, PlusCircle, Star, ThumbsUp, LogOut, Loader2, Sparkles } from 'lucide-react';

type ProgressWithRelations = Progress & {
  user: User;
  activity: Activity;
  attestations: Attestation[];
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [progressFeed, setProgressFeed] = useState<ProgressWithRelations[]>([]);
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [progressText, setProgressText] = useState('');

  const [newActivityTitle, setNewActivityTitle] = useState('');
  const [newActivityDesc, setNewActivityDesc] = useState('');
  const [newActivityPoints, setNewActivityPoints] = useState(10);

  // Loading States
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSubmittingProgress, setIsSubmittingProgress] = useState(false);
  const [isCreatingActivity, setIsCreatingActivity] = useState(false);
  const [attestingId, setAttestingId] = useState<string | null>(null);

  // Collision State
  const [collisionDetected, setCollisionDetected] = useState(false);
  const [tempUser, setTempUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('hl_user');
    if (savedUser) {
      setTimeout(() => setUser(JSON.parse(savedUser)), 0);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [acts, progs, leaders] = await Promise.all([
        axios.get('/api/activities'),
        axios.get('/api/progress'),
        axios.get('/api/leaderboard')
      ]);
      setActivities(acts.data);
      setProgressFeed(progs.data);
      setLeaderboard(leaders.data);
      if (acts.data.length > 0 && !selectedActivityId) {
        setSelectedActivityId(acts.data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  }, [selectedActivityId]);

  useEffect(() => {
    if (user) {
      setTimeout(() => fetchData(), 0);
    }
  }, [user, fetchData]);

  const handleLogin = async (e: React.FormEvent, confirmReturning = false) => {
    e?.preventDefault();
    if (!name.trim()) return;
    setIsLoggingIn(true);
    try {
      const res = await axios.post('/api/auth', { 
        name: name.trim(),
        role: name.trim().toLowerCase() === 'admin' ? 'ADMIN' : 'PARTICIPANT',
        confirmReturning
      });
      
      if (res.data.exists && !confirmReturning) {
        setCollisionDetected(true);
        setTempUser(res.data.user);
      } else {
        setUser(res.data.user);
        localStorage.setItem('hl_user', JSON.stringify(res.data.user));
        setCollisionDetected(false);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to login. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCollisionDetected(false);
    setName('');
    localStorage.removeItem('hl_user');
  };

  const submitProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressText.trim() || !selectedActivityId) return;
    setIsSubmittingProgress(true);
    try {
      await axios.post('/api/progress', {
        text: progressText,
        userId: user!.id,
        activityId: selectedActivityId
      });
      setProgressText('');
      await fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to submit progress. Please try again.');
    } finally {
      setIsSubmittingProgress(false);
    }
  };

  const handleAttest = async (progressId: string) => {
    setAttestingId(progressId);
    try {
      await axios.post('/api/attest', {
        userId: user!.id,
        progressId
      });
      await fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to attest. Please try again.');
    } finally {
      setAttestingId(null);
    }
  };

  const createActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityTitle.trim() || !newActivityDesc.trim()) return;
    setIsCreatingActivity(true);
    try {
      await axios.post('/api/activities', {
        title: newActivityTitle,
        description: newActivityDesc,
        points: newActivityPoints
      });
      setNewActivityTitle('');
      setNewActivityDesc('');
      setNewActivityPoints(10);
      await fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to create activity. Please try again.');
    } finally {
      setIsCreatingActivity(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-indigo-900">Humanistic Leadership</h1>
            <p className="text-gray-500">Share your journey, inspire others.</p>
          </div>

          {!collisionDetected ? (
            <form onSubmit={(e) => handleLogin(e, false)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Enter your name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="e.g. Jane Doe"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Joining...
                  </>
                ) : (
                  'Join Program'
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4 bg-indigo-50 p-6 rounded-xl border border-indigo-100 text-center">
              <Sparkles className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
              <h2 className="text-lg font-bold text-indigo-900">Hold on! A leader named <span className="text-indigo-600">{tempUser?.name}</span> is already here.</h2>
              <p className="text-sm text-gray-600">Are you returning, or are you a new leader sharing this great name?</p>
              
              <div className="space-y-3 pt-4">
                <button
                  onClick={(e) => handleLogin(e, true)}
                  disabled={isLoggingIn}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                >
                  Yes, that&apos;s me returning!
                </button>
                <button
                  onClick={() => {
                    setCollisionDetected(false);
                    setName(`${name} the Great`);
                  }}
                  disabled={isLoggingIn}
                  className="w-full flex justify-center py-2 px-4 border border-indigo-200 rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none"
                >
                  No, let&apos;s make my name unique!
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Star className="text-indigo-600 h-6 w-6" />
            <h1 className="text-xl font-bold text-indigo-900">Leadership Program</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm font-medium">
              <span className="text-gray-500">Hello, </span>
              <span className="text-indigo-600">{user.name}</span>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 transition">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="space-y-8 lg:col-span-1">
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold flex items-center space-x-2 mb-4">
                <CheckCircle className="text-green-500 h-5 w-5" />
                <span>Log Activity</span>
              </h2>
              {activities.length === 0 ? (
                <p className="text-sm text-gray-500">No activities available yet.</p>
              ) : (
                <form onSubmit={submitProgress} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Activity</label>
                    <select
                      value={selectedActivityId}
                      onChange={(e) => setSelectedActivityId(e.target.value)}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      {activities.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.title} ({a.points} pts)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">What did you do?</label>
                    <textarea
                      value={progressText}
                      onChange={(e) => setProgressText(e.target.value)}
                      rows={3}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="I led a team meeting focusing on empathy..."
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingProgress}
                    className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmittingProgress ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Sharing...
                      </>
                    ) : (
                      'Share Progress'
                    )}
                  </button>
                </form>
              )}
            </div>

            {user.role === 'ADMIN' && (
              <div className="bg-indigo-50 rounded-2xl shadow-sm border border-indigo-100 p-6">
                <h2 className="text-lg font-semibold flex items-center space-x-2 mb-4 text-indigo-900">
                  <PlusCircle className="text-indigo-600 h-5 w-5" />
                  <span>New Challenge (Admin)</span>
                </h2>
                <form onSubmit={createActivity} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={newActivityTitle}
                      onChange={(e) => setNewActivityTitle(e.target.value)}
                      className="block w-full rounded-md border border-indigo-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Activity Title"
                      required
                    />
                  </div>
                  <div>
                    <textarea
                      value={newActivityDesc}
                      onChange={(e) => setNewActivityDesc(e.target.value)}
                      rows={2}
                      className="block w-full rounded-md border border-indigo-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Description"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Points:</label>
                    <input
                      type="number"
                      value={newActivityPoints}
                      onChange={(e) => setNewActivityPoints(Number(e.target.value))}
                      className="block w-20 rounded-md border border-indigo-200 px-3 py-1 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                      min={1}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isCreatingActivity}
                    className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 border-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isCreatingActivity ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Posting...
                      </>
                    ) : (
                      'Post Activity'
                    )}
                  </button>
                </form>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold flex items-center space-x-2 mb-4">
                <Trophy className="text-yellow-500 h-5 w-5" />
                <span>Leaderboard</span>
              </h2>
              <div className="space-y-3">
                {leaderboard.map((leader, idx) => (
                  <div key={leader.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition">
                    <div className="flex items-center space-x-3">
                      <span className={`font-bold ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-gray-400'}`}>
                        #{idx + 1}
                      </span>
                      <span className="font-medium text-sm">{leader.name} {leader.id === user.id && '(You)'}</span>
                    </div>
                    <div className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                      {leader.score} pts
                    </div>
                  </div>
                ))}
                {leaderboard.length === 0 && <p className="text-sm text-gray-500">No leaders yet.</p>}
              </div>
            </div>

          </div>

          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Activity Feed</h2>
            
            {progressFeed.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                <p className="text-gray-500">No activities shared yet. Be the first!</p>
              </div>
            ) : (
              progressFeed.map((prog) => {
                const hasAttested = prog.attestations.some(a => a.userId === user.id);
                const isAttesting = attestingId === prog.id;
                return (
                  <div key={prog.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition hover:shadow-md">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{prog.user.name}</h3>
                        <p className="text-sm text-indigo-600 font-medium">Completed: {prog.activity.title}</p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(prog.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap mb-4 bg-gray-50 p-4 rounded-xl text-sm">
                      &quot;{prog.text}&quot;
                    </p>
                    <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                      <div className="text-sm text-gray-500">
                        <span className="font-medium text-indigo-600">{prog.activity.points} pts</span> awarded
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-xs text-gray-500">
                          {prog.attestations.length} {prog.attestations.length === 1 ? 'attestation' : 'attestations'}
                        </span>
                        {prog.userId !== user.id && (
                          <button
                            onClick={() => handleAttest(prog.id)}
                            disabled={hasAttested || isAttesting}
                            className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                              hasAttested 
                                ? 'bg-green-50 text-green-600 cursor-not-allowed' 
                                : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                          >
                            {isAttesting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <ThumbsUp className="h-4 w-4" />
                            )}
                            <span>{isAttesting ? 'Attesting...' : hasAttested ? 'Attested' : 'Attest'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
