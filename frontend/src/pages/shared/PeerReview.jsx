import React, { useState, useEffect } from 'react';
import { teamService, adminService } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { Star, MessageSquare, User, Send, CheckCircle2, Loader2, Info } from 'lucide-react';

export default function PeerReview({ teamId: propTeamId }) {
  const { user } = useApp();
  const activeTeamId = propTeamId || user?.teamId;
  const [teamMembers, setTeamMembers] = useState([]);
  const [reviewsDone, setReviewsDone] = useState([]);
  const [reviewsReceived, setReviewsReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null); // ID of person being reviewed
  const [submitted, setSubmitted] = useState(false);

  // Review Form State
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});

  useEffect(() => {
    if (activeTeamId) fetchData();
  }, [activeTeamId]);

  const fetchData = async () => {
    try {
      // 1. Get all teams to find members of THIS team
      // (Improvement: backend could have GET /teams/{id}/members)
      const teamsRes = await teamService.getAll();
      const myTeam = teamsRes.data.find(t => t.id === activeTeamId);
      if (myTeam) {
        setTeamMembers(myTeam.students.filter(s => s.id !== user.id));
      }

      // 2. Get reviews for this team
      const reviewsRes = await teamService.getReviews(activeTeamId);
      const allReviews = reviewsRes.data;
      
      setReviewsDone(allReviews.filter(r => r.reviewer_id === user.id));
      setReviewsReceived(allReviews.filter(r => r.reviewee_id === user.id));

      // 3. Pre-fill form if reviews already exist
      const initialRatings = {};
      const initialComments = {};
      allReviews.filter(r => r.reviewer_id === user.id).forEach(r => {
        initialRatings[r.reviewee_id] = r.rating;
        initialComments[r.reviewee_id] = r.comment;
      });
      setRatings(initialRatings);
      setComments(initialComments);

    } catch (err) {
      console.error("Failed to fetch peer review data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (revieweeId, starRating) => {
    if (!activeTeamId) return;
    const rating = starRating || ratings[revieweeId];
    if (!rating) {
      alert('Please select a star rating before submitting.');
      return;
    }
    setSubmitting(revieweeId);
    try {
      await teamService.createReview({
        team_id: activeTeamId,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating: rating,
        comment: comments[revieweeId] || ""
      });
      fetchData(); // Refresh
      setSubmitted(true);
      setRatings({});
      setComments({});
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      console.error('Failed to submit review', err);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Star className="w-7 h-7 text-amber-500 fill-amber-500" /> تقييم الزملاء (Peer Review)
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">ساهم في تطوير فريقك من خلال تقديم ملاحظات بناءة لزملائك.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Review Form */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 px-1">
            <Send className="w-4 h-4 text-blue-600" /> أعضاء الفريق
          </h3>
          
          <div className="space-y-4">
            {teamMembers.map(member => {
              const hasReviewed = reviewsDone.some(r => r.reviewee_id === member.id);
              return (
                <div key={member.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-lg">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">{member.name}</h4>
                      <p className="text-xs text-slate-400">{member.email}</p>
                    </div>
                    {hasReviewed && (
                      <span className="mr-auto badge badge-green text-[10px] animate-pulse">تم التقييم</span>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">التقييم:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            onClick={() => handleSubmit(member.id, star)}
                            className="focus:outline-none transition-transform hover:scale-125"
                          >
                            <Star 
                              className={`w-6 h-6 ${
                                (ratings[member.id] || 0) >= star 
                                  ? 'text-amber-500 fill-amber-500' 
                                  : 'text-slate-200 dark:text-slate-700'
                              }`} 
                            />
                          </button>
                        ))}
                      </div>
                      {submitted && <p className="text-[10px] text-emerald-500 font-bold mt-2 animate-bounce">✓ Feedback Sent!</p>}
                    </div>

                    <textarea
                      placeholder="اكتب ملاحظاتك الايجابية أو نصيحة لزميلك..."
                      value={comments[member.id] || ""}
                      onChange={(e) => setComments(prev => ({ ...prev, [member.id]: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-400"
                      rows={3}
                    />

                    <button
                      onClick={() => handleSubmit(member.id)}
                      disabled={submitting === member.id || hasReviewed}
                      className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        hasReviewed 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default'
                          : submitting === member.id
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20'
                      }`}
                    >
                      {submitting === member.id ? <Loader2 className="w-4 h-4 animate-spin" /> : hasReviewed ? <><CheckCircle2 className="w-4 h-4" /> تم الإرسال بنجاح</> : <><CheckCircle2 className="w-4 h-4" /> حفظ وإرسال التقييم</>}
                    </button>
                  </div>
                </div>
              );
            })}
            {teamMembers.length === 0 && (
              <div className="card p-10 text-center text-slate-400">
                <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>لا يوجد أعضاء آخرين في فريقك حالياً.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Feedback Received */}
        <div className="space-y-6">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 px-1">
            <MessageSquare className="w-4 h-4 text-purple-500" /> الملاحظات المستلمة
          </h3>

          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl shadow-purple-500/20">
              <div className="text-3xl font-black mb-1">
                {(reviewsReceived.reduce((acc, r) => acc + r.rating, 0) / (reviewsReceived.length || 1)).toFixed(1)}
              </div>
              <div className="text-xs font-bold opacity-80 uppercase tracking-widest mb-4">متوسط تقييمك</div>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-4 h-4 ${s <= Math.round(reviewsReceived.reduce((acc, r) => acc + r.rating, 0) / (reviewsReceived.length || 1)) ? 'fill-white' : 'opacity-30'}`} />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {reviewsReceived.map(review => (
                <div key={review.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm border-r-4 border-r-purple-500">
                  <div className="flex gap-1 mb-2">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-2.5 h-2.5 ${s <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200 dark:text-slate-700'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
                    "{review.comment || 'بدون تعليق.'}"
                  </p>
                  <p className="text-[9px] text-slate-400 mt-2 text-left">
                    {new Date(review.date).toLocaleDateString('ar-EG')} · ملاحظة مجهولة
                  </p>
                </div>
              ))}
              
              {reviewsReceived.length === 0 && (
                <div className="p-6 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-2xl text-center text-slate-400">
                  <Info className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-xs">لم تستلم أي ملاحظات بعد. ابدأ بتقييم زملائك لتشجيعهم!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
