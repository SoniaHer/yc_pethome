import React from "react";
import { Modal, StyleSheet, Text, TextInput, View, Image } from "react-native";
import TextButton from "react-native-button";
import firebase from "react-native-firebase";
import StarRating from "react-native-star-rating";
import { connect } from "react-redux";
import { AppStyles, ModalHeaderStyle, AppIcon } from "../AppStyles";
import Button from "react-native-button";

class ReviewModal extends React.Component {
  constructor(props) {
    super(props);

    const listing = this.props.listing;
    this.state = {
      data: listing,
      content: "",
      starCount: 5
    };
  }

  onPostReview = () => {
    const navigation = this.props.navigation;
    if (!this.state.content) {
      alert("Please enter a review before submitting!");
      return;
    }

    const { user, onDone } = this.props;
    const { data, starCount, content } = this.state;

    firebase
      .firestore()
      .collection("real_estate_reviews")
      .where("listing_id", "==", data.id)
      .where("user_id", "==", user.id)
      .get()
      .then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          doc.ref.delete();
        });
        firebase
          .firestore()
          .collection("real_estate_reviews")
          .add({
            user_id: user.id,
            listing_id: data.id,
            star_count: starCount,
            content: content,
            authorName: user.fullname,
            authorPhoto: user.profileURL,
            review_time: firebase.firestore.FieldValue.serverTimestamp()
          })
          .then(function(docRef) {
            firebase
              .firestore()
              .collection("real_estate_reviews")
              .where("listing_id", "==", data.id)
              .get()
              .then(function(reviewQuerySnapshot) {
                let total_star_count = 0,
                  count = 0;
                reviewQuerySnapshot.forEach(function(reviewDoc) {
                  const review = reviewDoc.data();

                  total_star_count += review.star_count;
                  count++;
                });

                if (count > 0) {
                  data.starCount = total_star_count / count;
                } else {
                  data.starCount = 0;
                }

                firebase
                  .firestore()
                  .collection("real_estate_listings")
                  .doc(data.id)
                  .set(data);
                onDone();
              });
          })
          .catch(function(error) {
            alert(error);
          });
      });
  };

  onCancel = () => {
    this.props.onCancel();
  };

  render() {
    return (
      <Modal
        animationType="slide"
        transparent={false}
        onRequestClose={this.onCancel}
      >
        <View style={styles.body}>
          <View style={ModalHeaderStyle.bar}>
            <Text style={ModalHeaderStyle.title}>Add a Review</Text>
            <TextButton
              style={{ ...ModalHeaderStyle.rightButton, paddingRight: 10 }}
              onPress={this.onCancel}
            >
              Cancel
            </TextButton>
          </View>
          <View style={styles.bodyContainer}>
            <StarRating
              containerStyle={styles.starRatingContainer}
              disabled={false}
              maxStars={5}
              starSize={25}
              starStyle={styles.starStyle}
              selectedStar={rating => this.setState({ starCount: rating })}
              emptyStar={AppIcon.images.starNoFilled}
              fullStar={AppIcon.images.starFilled}
              rating={this.state.starCount}
            />
            <TextInput
              multiline={true}
              style={styles.input}
              onChangeText={text => this.setState({ content: text })}
              value={this.state.content}
              placeholder="Start typing"
              placeholderTextColor={AppStyles.color.grey}
              underlineColorAndroid="transparent"
            />
            <Button
              containerStyle={styles.btnContainer}
              style={styles.btnText}
              onPress={() => this.onPostReview()}
            >
              Add review
            </Button>
          </View>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  bodyContainer: {
    alignSelf: "center",
    width: "95%",
    height: "86%"
  },
  input: {
    flex: 1,
    width: "100%",
    fontSize: 19,
    textAlignVertical: "top",
    lineHeight: 26,
    fontFamily: AppStyles.fontName.main,
    color: AppStyles.color.text
  },
  starRatingContainer: {
    width: 90,
    marginVertical: 12
  },
  starStyle: {
    tintColor: AppStyles.color.tint
  },
  btnContainer: {
    width: "100%",
    height: 48,
    justifyContent: "center",
    backgroundColor: AppStyles.color.tint,
  },
  btnText: {
    color: AppStyles.color.white
  }
});

const mapStateToProps = state => ({
  user: state.auth.user
});

export default connect(mapStateToProps)(ReviewModal);
