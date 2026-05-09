import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: number;
  showValue?: boolean;
  showCount?: boolean;
  reviewCount?: number;
  editable?: boolean;
  onRatingChange?: (rating: number) => void;
  style?: any;
}

const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  size = 16,
  showValue = false,
  showCount = false,
  reviewCount,
  editable = false,
  onRatingChange,
  style,
}) => {
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <TouchableOpacity
          key={`full-${i}`}
          disabled={!editable}
          onPress={() => editable && onRatingChange?.(i + 1)}
          style={styles.starContainer}
        >
          <Icon
            name="star"
            size={size}
            color="#fbbf24"
            style={styles.star}
          />
        </TouchableOpacity>
      );
    }

    // Half star
    if (hasHalfStar) {
      stars.push(
        <TouchableOpacity
          key="half"
          disabled={!editable}
          onPress={() => editable && onRatingChange?.(fullStars + 1)}
          style={styles.starContainer}
        >
          <Icon
            name="star-half"
            size={size}
            color="#fbbf24"
            style={styles.star}
          />
        </TouchableOpacity>
      );
    }

    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <TouchableOpacity
          key={`empty-${i}`}
          disabled={!editable}
          onPress={() => editable && onRatingChange?.(fullStars + (hasHalfStar ? 1 : 0) + i + 1)}
          style={styles.starContainer}
        >
          <Icon
            name="star-outline"
            size={size}
            color="#d1d5db"
            style={styles.star}
          />
        </TouchableOpacity>
      );
    }

    return stars;
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.starsContainer}>{renderStars()}</View>
      
      {(showValue || showCount) && (
        <View style={styles.textContainer}>
          {showValue && (
            <Text style={[styles.ratingText, { fontSize: size * 0.875 }]}>
              {rating.toFixed(1)}
            </Text>
          )}
          
          {showCount && reviewCount && (
            <Text style={[styles.countText, { fontSize: size * 0.75 }]}>
              ({reviewCount})
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    marginRight: 2,
  },
  star: {
    marginHorizontal: 1,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  ratingText: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  countText: {
    color: '#6b7280',
    marginLeft: 4,
  },
});

export default RatingStars;
