import React from 'react';

const StarIllustration = () => {
  const imageUrl1 = "https://genimi3-1388279700.cos.ap-shanghai.myqcloud.com/genimi%E5%9B%BE%E7%89%87/14%E4%B8%BB%E6%98%9F.jpg";
  const imageUrl2 = "https://genimi3-1388279700.cos.ap-shanghai.myqcloud.com/genimi%E5%9B%BE%E7%89%87/%E8%BE%85%E6%98%9F.jpg";

  return (
    <div className="mt-8 pb-8 text-center space-y-8">
      <img 
        src={imageUrl1} 
        alt="紫微斗数14主星图" 
        className="w-full max-w-3xl mx-auto rounded-3xl shadow-xl shadow-pink-200 border-4 border-white"
      />
      <img 
        src={imageUrl2} 
        alt="紫微斗数辅星图" 
        className="w-full max-w-3xl mx-auto rounded-3xl shadow-xl shadow-pink-200 border-4 border-white"
      />
    </div>
  );
};

export default StarIllustration;
