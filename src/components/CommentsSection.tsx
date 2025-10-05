import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Comment } from "../types";

interface CommentsSectionProps {
  spotId: string;
  comments: Comment[];
  onAddComment: (content: string, rating?: number) => void;
  onLikeComment: (commentId: string) => void;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({
  spotId,
  comments,
  onAddComment,
  onLikeComment,
}) => {
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState<number | undefined>();
  const [showAddComment, setShowAddComment] = useState(false);

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment.trim(), rating);
      setNewComment("");
      setRating(undefined);
      setShowAddComment(false);
    }
  };

  const renderStars = (
    currentRating?: number,
    interactive = false,
    onRate?: (rating: number) => void
  ) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            disabled={!interactive}
            onPress={() => interactive && onRate?.(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={
                currentRating && star <= currentRating ? "star" : "star-outline"
              }
              size={16}
              color={
                currentRating && star <= currentRating ? "#FFD700" : "#ccc"
              }
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentContainer}>
      <View style={styles.commentHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.createdAt).toLocaleDateString("pl-PL")}
          </Text>
        </View>
        {item.rating && renderStars(item.rating)}
      </View>

      <Text style={styles.commentContent}>{item.content}</Text>

      <View style={styles.commentActions}>
        <TouchableOpacity
          style={[styles.likeButton, item.likes > 0 && styles.likeButtonLiked]}
          onPress={() => onLikeComment(item.id)}
        >
          <Ionicons
            name={item.likes > 0 ? "heart" : "heart-outline"}
            size={18}
            color={item.likes > 0 ? "#e74c3c" : "#666"}
            style={styles.likeIcon}
          />
          <Text style={[styles.likeCount, item.likes > 0 && styles.likeCountLiked]}>
            {item.likes}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Doświadczenia ({comments.length})</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddComment(true)}
        >
          <Ionicons name="add-circle" size={24} color="#3498db" />
          <Text style={styles.addButtonText}>Dodaj komentarz</Text>
        </TouchableOpacity>
      </View>

      {comments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>
            Brak komentarzy. Bądź pierwszy, który podzieli się doświadczeniem!
          </Text>
        </View>
      ) : (
        <FlatList
          data={comments.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )}
          keyExtractor={(item) => item.id}
          renderItem={renderComment}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.commentsList}
        />
      )}

      {/* Modal do dodawania komentarza */}
      <Modal
        visible={showAddComment}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddComment(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Podziel się doświadczeniem</Text>
              <TouchableOpacity
                onPress={() => setShowAddComment(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Twoja ocena (opcjonalne):</Text>
              {renderStars(rating, true, setRating)}
            </View>

            <TextInput
              style={styles.commentInput}
              placeholder="Opisz swoje doświadczenie z tym miejscem..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
              numberOfLines={4}
              maxLength={500}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddComment(false)}
              >
                <Text style={styles.cancelButtonText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleAddComment}
              >
                <Text style={styles.submitButtonText}>Opublikuj</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e8ed",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f4f8",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: "#3498db",
    fontWeight: "500",
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
  },
  commentsList: {
    padding: 16,
  },
  commentContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  starsContainer: {
    flexDirection: "row",
  },
  starButton: {
    padding: 2,
  },
  commentContent: {
    fontSize: 14,
    color: "#34495e",
    lineHeight: 20,
    marginBottom: 12,
  },
  commentActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e1e8ed",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minWidth: 70,
    justifyContent: "center",
  },
  likeButtonLiked: {
    backgroundColor: "linear-gradient(135deg, #ffebee, #ffcdd2)",
    borderColor: "#e57373",
    shadowColor: "#e57373",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  likeIcon: {
    marginRight: 6,
  },
  likeCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  likeCountLiked: {
    color: "#e74c3c",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2c3e50",
  },
  closeButton: {
    padding: 4,
  },
  ratingSection: {
    marginBottom: 16,
  },
  ratingLabel: {
    fontSize: 16,
    color: "#2c3e50",
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: "#f8f9fa",
  },
  submitButton: {
    backgroundColor: "#3498db",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "500",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default CommentsSection;
